extends "res://tools/test_case.gd"

const Helpers: GDScript = preload("res://tests/ui_helpers.gd")
const Build: GDScript = preload("res://tests/builders.gd")


func _panel(view: BattleView, battle: Battle, team_idx: int, index: int) -> FighterPanel:
	return view.panels[battle.teams[team_idx].fighters[index]]


func _hit_battle() -> Battle:
	var strike: AbilityData = Build.hit(20, [Build.R])
	strike.display_name = "Strike"
	var team_a: Team = Build.team([strike])
	var team_b: Team = Build.team([strike])
	var battle: Battle = Build.battle(team_a, team_b, 5)
	Build.give(team_a.pool, [Build.N, Build.N, Build.N])
	return battle


func test_view_shows_names_hp_and_one_panel_per_fighter() -> void:
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	assert_eq(view.panels.size(), 6)
	assert_eq(view.sprites.size(), 6)
	assert_eq(view.player_board.get_child_count(), 3)
	assert_eq(view.enemy_board.get_child_count(), 3)
	var player_names: Array[String] = []
	for i: int in 3:
		var panel: FighterPanel = _panel(view, battle, 0, i)
		player_names.append(panel.name_label.text)
		assert_eq(panel.hp_label.text, "100 / 100")
		assert_eq(panel.hp_bar.value, 100.0)
	assert_eq(player_names, ["Naruto", "Sasuke", "Sakura"] as Array[String])
	assert_eq(_panel(view, battle, 1, 2).name_label.text, "Sakura")
	assert_eq((view.sprites[battle.teams[0].fighters[0]] as FighterSprite).fighter.display_name(), "Naruto")
	Helpers.unmount(view)


func test_view_updates_hp_through_the_hp_changed_signal() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var source: Fighter = battle.teams[0].fighters[0]
	var target: Fighter = battle.teams[1].fighters[1]
	var action: Action = Action.new(source, source.abilities[0], target)
	battle.submit_turn(0, Helpers.actions([action]), Helpers.payment([Build.N]))
	assert_eq(target.hp, 80)
	var panel: FighterPanel = view.panels[target]
	assert_eq(panel.hp_label.text, "80 / 100")
	assert_eq(panel.hp_bar.value, 80.0)
	assert_eq(view.panels[battle.teams[1].fighters[0]].hp_label.text, "100 / 100")
	Helpers.unmount(view)


func test_view_marks_a_dead_fighter() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var target: Fighter = battle.teams[1].fighters[0]
	target.hp = 15
	var source: Fighter = battle.teams[0].fighters[0]
	battle.submit_turn(0, Helpers.actions([Action.new(source, source.abilities[0], target)]), Helpers.payment([Build.N]))
	var panel: FighterPanel = view.panels[target]
	assert_eq(panel.hp_label.text, "0 / 100")
	assert_eq(panel.hp_bar.theme_type_variation, &"DeadHpBar")
	assert_eq(panel.avatar_rect.texture, Art.dead_avatar())
	assert_false((view.sprites[target] as FighterSprite).alive)
	Helpers.unmount(view)


func test_view_shows_chakra_counts_per_type_and_updates_on_payment() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var pool: ChakraPool = battle.teams[0].pool
	var ninjutsu_before: int = pool.count(ChakraType.Type.NINJUTSU)
	assert_eq(view.chakra_labels[ChakraType.Type.NINJUTSU].text, "x%d" % ninjutsu_before)
	assert_eq(view.chakra_total.text, "Total: %d" % pool.total())
	var source: Fighter = battle.teams[0].fighters[0]
	battle.submit_turn(0, Helpers.actions([Action.new(source, source.abilities[0], battle.teams[1].fighters[0])]), Helpers.payment([Build.N]))
	assert_eq(view.chakra_labels[ChakraType.Type.NINJUTSU].text, "x%d" % battle.teams[0].pool.count(ChakraType.Type.NINJUTSU))
	assert_eq(view.chakra_total.text, "Total: %d" % (pool.total()))
	var summed: int = 0
	for type: ChakraType.Type in ChakraType.real_types():
		summed += int(view.chakra_labels[type].text.trim_prefix("x"))
	assert_eq(summed, pool.total())
	Helpers.unmount(view)


func test_view_shows_chakra_counts_for_a_known_pool() -> void:
	var battle: Battle = Helpers.real_battle()
	var pool: ChakraPool = battle.teams[0].pool
	pool.chakras.clear()
	Build.give(pool, [Build.N, Build.N, Build.T, Build.B, Build.B, Build.B])
	var view: BattleView = Helpers.mount_battle(battle)
	assert_eq(view.chakra_labels[ChakraType.Type.NINJUTSU].text, "x2")
	assert_eq(view.chakra_labels[ChakraType.Type.TAIJUTSU].text, "x1")
	assert_eq(view.chakra_labels[ChakraType.Type.GENJUTSU].text, "x0")
	assert_eq(view.chakra_labels[ChakraType.Type.BLOODLINE].text, "x3")
	assert_eq(view.chakra_total.text, "Total: 6")
	Helpers.unmount(view)


func test_ability_buttons_show_icon_cost_and_lock_state() -> void:
	var battle: Battle = Helpers.real_battle()
	var pool: ChakraPool = battle.teams[0].pool
	pool.chakras.clear()
	pool.add(ChakraType.Type.NINJUTSU)
	var view: BattleView = Helpers.mount_battle(battle)
	var sasuke_panel: FighterPanel = _panel(view, battle, 0, 1)
	assert_eq(sasuke_panel.ability_buttons.size(), 4)
	var fireball: AbilityButton = sasuke_panel.ability_buttons[0]
	assert_eq(fireball.state.data.display_name, "Fireball")
	assert_true(fireball.button.icon != null)
	assert_eq(fireball.cost_row.get_child_count(), 1)
	assert_false(fireball.is_locked())
	assert_false(fireball.button.disabled)
	var chidori: AbilityButton = sasuke_panel.ability_buttons[1]
	assert_eq(chidori.lock_reason, "Not enough chakra")
	assert_true(chidori.button.disabled)
	Helpers.unmount(view)


func test_cooldown_and_chakra_lock_update_after_the_ability_is_used() -> void:
	var battle: Battle = Helpers.real_battle()
	var pool: ChakraPool = battle.teams[0].pool
	Build.give(pool, [Build.N, Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	var sasuke: Fighter = battle.teams[0].fighters[1]
	var fireball: AbilityState = Helpers.find_state(sasuke, "Fireball")
	var button: AbilityButton = _panel(view, battle, 0, 1).ability_buttons[0]
	assert_false(button.cooldown_label.visible)
	battle.submit_turn(0, Helpers.actions([Action.new(sasuke, fireball, battle.teams[1].fighters[0])]), Helpers.payment())
	assert_eq(fireball.cooldown, 2)
	assert_eq(button.cooldown_label.text, "2")
	assert_true(button.cooldown_label.visible)
	assert_eq(button.lock_reason, "Cooldown: 2")
	assert_true(button.button.disabled)
	battle.submit_turn(1, Helpers.actions([]), Helpers.payment())
	assert_eq(button.cooldown_label.text, "1")
	assert_true(button.button.disabled)
	battle.submit_turn(0, Helpers.actions([]), Helpers.payment())
	battle.submit_turn(1, Helpers.actions([]), Helpers.payment())
	assert_false(button.cooldown_label.visible)
	Helpers.unmount(view)


func test_gated_ability_is_locked_until_enabled() -> void:
	var battle: Battle = MatchFactory.new_match(Helpers.team_of(["Naruto", "Sasuke", "Sakura"]), 2)
	var pool: ChakraPool = battle.teams[0].pool
	Build.give(pool, [Build.N, Build.N, Build.N, Build.N, Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	var naruto: Fighter = battle.teams[0].fighters[0]
	var rasengan: AbilityState = Helpers.find_state(naruto, "Rasengan")
	assert_eq(view.lock_reason(naruto, rasengan), "Not available yet")
	var clone: AbilityState = Helpers.find_state(naruto, "Kage Bunshin")
	naruto.add_enable("Kage Bunshin", 3, ["Rasengan"] as Array[String])
	assert_eq(view.lock_reason(naruto, rasengan), "")
	assert_true(clone != null)
	Helpers.unmount(view)


func test_stunned_fighter_abilities_are_locked_and_effect_chip_shows() -> void:
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var sakura: Fighter = battle.teams[0].fighters[2]
	sakura.add_stun("Rasengan", 1, "This character cannot act.")
	view.refresh_all()
	var panel: FighterPanel = _panel(view, battle, 0, 2)
	for button: AbilityButton in panel.ability_buttons:
		assert_eq(button.lock_reason, "Stunned")
	assert_eq(panel.effects_box.get_child_count(), 1)
	assert_true(panel.effects_box.get_child(0).tooltip_text.contains("cannot act"))
	Helpers.unmount(view)


func test_effects_list_updates_when_a_turn_starts() -> void:
	var guard: AbilityData = Build.self_cast("Guard", [Build.effect(EffectData.Kind.DAMAGE_REDUCTION, 10, 2)])
	var battle: Battle = Build.battle(Build.team([guard]), Build.team([guard]), 4)
	var view: BattleView = Helpers.mount_battle(battle)
	var caster: Fighter = battle.teams[0].fighters[0]
	var panel: FighterPanel = view.panels[caster]
	assert_eq(panel.effects_box.get_child_count(), 0)
	battle.submit_turn(0, Helpers.actions([Action.new(caster, caster.abilities[0], null)]), Helpers.payment())
	battle.submit_turn(1, Helpers.actions([]), Helpers.payment())
	assert_eq(panel.effects_box.get_child_count(), 1)
	Helpers.unmount(view)


func test_enemy_panels_have_no_ability_buttons() -> void:
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var enemy_panel: FighterPanel = _panel(view, battle, 1, 0)
	assert_eq(enemy_panel.ability_buttons.size(), 0)
	assert_false(enemy_panel.abilities_row.visible)
	Helpers.unmount(view)


func test_footer_shows_the_hovered_ability() -> void:
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	assert_eq(view.desc_text.text, BattleView.HINT_TEXT)
	var button: AbilityButton = _panel(view, battle, 0, 0).ability_buttons[2]
	button.button.mouse_entered.emit()
	var data: AbilityData = button.state.data
	assert_eq(view.desc_name.text, data.display_name)
	assert_eq(view.desc_text.text, data.description)
	assert_eq(view.desc_costs.get_child_count(), data.cost.size())
	assert_true(view.desc_meta.text.contains("Cooldown: %d" % data.cooldown))
	assert_true(view.desc_icon.texture != null)
	Helpers.unmount(view)


func test_turn_and_timer_labels_and_modal_buttons() -> void:
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	assert_eq(view.turn_label.text, "Turn 1")
	assert_eq(view.timer_label.text, "60")
	assert_false(view.end_turn_button.disabled)
	assert_false(view.surrender_button.disabled)
	assert_false(view.history_button.disabled)
	assert_false(view.exchange_button.disabled)
	battle.submit_turn(0, Helpers.actions([]), Helpers.payment())
	assert_eq(view.turn_label.text, "Turn 2")
	Helpers.unmount(view)


func test_view_does_not_change_battle_state() -> void:
	var battle: Battle = Helpers.real_battle(9)
	var hp_before: Array[int] = []
	for team: Team in battle.teams:
		for fighter: Fighter in team.fighters:
			hp_before.append(fighter.hp)
	var chakra_before: Array[ChakraType.Type] = battle.teams[0].pool.chakras.duplicate()
	var view: BattleView = Helpers.mount_battle(battle)
	view.refresh_all()
	view.show_ability(battle.teams[0].fighters[0].abilities[0])
	var hp_after: Array[int] = []
	for team: Team in battle.teams:
		for fighter: Fighter in team.fighters:
			hp_after.append(fighter.hp)
	assert_eq(hp_after, hp_before)
	assert_eq(battle.teams[0].pool.chakras, chakra_before)
	assert_eq(battle.turn, 1)
	Helpers.unmount(view)


func test_rebinding_a_new_battle_rebuilds_the_panels() -> void:
	var first: Battle = Helpers.real_battle(1)
	var view: BattleView = Helpers.mount_battle(first)
	var second: Battle = Helpers.real_battle(2)
	view.bind(second)
	assert_eq(view.panels.size(), 6)
	assert_true(view.panels.has(second.teams[0].fighters[0]))
	assert_false(view.panels.has(first.teams[0].fighters[0]))
	assert_eq(view.player_board.get_child_count(), 3)
	Helpers.unmount(view)
