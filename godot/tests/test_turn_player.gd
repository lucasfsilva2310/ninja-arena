extends "res://tools/test_case.gd"

const Helpers: GDScript = preload("res://tests/ui_helpers.gd")
const Build: GDScript = preload("res://tests/builders.gd")
const Gate: GDScript = preload("res://tests/gated_turn_player.gd")


func _two_hit_events() -> Array[BattleEvent]:
	var strike: AbilityData = Build.hit(20, [Build.R])
	strike.display_name = "Strike"
	var team_a: Team = Build.team([strike])
	var team_b: Team = Build.team([strike])
	var battle: Battle = Build.battle(team_a, team_b, 5)
	Build.give(team_a.pool, [Build.N, Build.N, Build.N])
	var first: Fighter = team_a.fighters[0]
	var second: Fighter = team_a.fighters[1]
	var actions: Array[Action] = Helpers.actions([
		Action.new(first, first.abilities[0], team_b.fighters[0]),
		Action.new(second, second.abilities[0], team_b.fighters[1]),
	])
	return battle.submit_turn(0, actions, Helpers.payment([Build.N, Build.N]))


func _log_of(player: TurnPlayer) -> Array[String]:
	var log: Array[String] = []
	player.phase_started.connect(func(phase: String, _used: BattleEvent) -> void: log.append("phase:" + phase))
	player.event_played.connect(func(event: BattleEvent) -> void: log.append("event:" + BattleEvent.Type.keys()[event.type]))
	return log


func test_events_play_in_queue_order_one_action_at_a_time() -> void:
	var player: TurnPlayer = TurnPlayer.new()
	var log: Array[String] = _log_of(player)
	player.play(_two_hit_events())
	var first_used: int = log.find("event:ABILITY_USED")
	var second_used: int = log.find("event:ABILITY_USED", first_used + 1)
	assert_true(first_used != -1 and second_used > first_used)
	var between: Array[String] = log.slice(first_used, second_used)
	assert_eq(between, ["event:ABILITY_USED", "phase:attack", "phase:impact", "event:DAMAGE", "phase:recovery"] as Array[String])


func test_damage_event_comes_after_the_impact_phase() -> void:
	var player: TurnPlayer = TurnPlayer.new()
	var log: Array[String] = _log_of(player)
	player.play(_two_hit_events())
	assert_true(log.find("phase:impact") < log.find("event:DAMAGE"))
	assert_true(log.find("phase:attack") < log.find("phase:impact"))
	assert_true(log.find("event:DAMAGE") < log.find("phase:recovery"))


func test_finished_fires_once_after_the_last_event_and_playing_resets() -> void:
	var player: TurnPlayer = TurnPlayer.new()
	var counter: Array[int] = [0]
	player.finished.connect(func() -> void: counter[0] += 1)
	var events: Array[BattleEvent] = _two_hit_events()
	var seen: Array[int] = [0]
	player.event_played.connect(func(_event: BattleEvent) -> void: seen[0] += 1)
	player.play(events)
	assert_eq(counter[0], 1)
	assert_eq(seen[0], events.size())
	assert_false(player.playing)


func test_an_action_without_damage_has_no_impact_or_recovery_phase() -> void:
	var heal: AbilityData = Build.self_cast("Mend", [Build.effect(EffectData.Kind.DAMAGE_REDUCTION, 5, 1)])
	var team_a: Team = Build.team([heal])
	var team_b: Team = Build.team([heal])
	var battle: Battle = Build.battle(team_a, team_b, 5)
	var source: Fighter = team_a.fighters[0]
	var events: Array[BattleEvent] = battle.submit_turn(0, Helpers.actions([Action.new(source, source.abilities[0], source)]), Helpers.payment())
	var player: TurnPlayer = TurnPlayer.new()
	var log: Array[String] = _log_of(player)
	player.play(events)
	assert_eq(log.has("phase:attack"), true)
	assert_eq(log.has("phase:impact"), false)
	assert_eq(log.has("phase:recovery"), false)


func test_the_view_shows_old_hp_until_the_impact_phase_ends() -> void:
	var strike: AbilityData = Build.hit(20, [Build.R])
	strike.display_name = "Strike"
	var team_a: Team = Build.team([strike])
	var team_b: Team = Build.team([strike])
	var battle: Battle = Build.battle(team_a, team_b, 5)
	Build.give(team_a.pool, [Build.N, Build.N, Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	var gate: TurnPlayer = Gate.new()
	view.set_turn_player(gate)
	var source: Fighter = team_a.fighters[0]
	var target: Fighter = team_b.fighters[0]
	view.queue.try_add(Action.new(source, source.abilities[0], target))
	view.end_turn()
	if view.modal != null:
		var payment: PaymentModal = view.modal as PaymentModal
		for type: ChakraType.Type in view.queue.random_candidates().slice(0, payment.slots):
			payment.picker.add_buttons[type].pressed.emit()
		payment.confirm_button.pressed.emit()
	assert_eq(target.hp, 80)
	var panel: FighterPanel = view.panels[target]
	assert_eq(panel.hp_label.text, "100 / 100")
	assert_true(gate.playing)
	assert_eq(panel.hp_label.text, "100 / 100")
	assert_eq(panel.hp_bar.value, 100.0)
	gate.emit_signal("release_impact")
	assert_eq(panel.hp_label.text, "80 / 100")
	Helpers.unmount(view)


func test_input_stays_locked_until_the_last_animation_ends() -> void:
	AnimConfig.fast = false
	var strike: AbilityData = Build.hit(20, [Build.R])
	strike.display_name = "Strike"
	var team_a: Team = Build.team([strike])
	var team_b: Team = Build.team([strike])
	var battle: Battle = Build.battle(team_a, team_b, 5)
	Build.give(team_a.pool, [Build.N, Build.N, Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	view.use_animations()
	var source: Fighter = team_a.fighters[0]
	view.queue.try_add(Action.new(source, source.abilities[0], team_b.fighters[0]))
	var payment_list: Array[ChakraType.Type] = [Build.N]
	view._submit_player_turn(view.queue.plan_with_payment(payment_list))
	assert_true(view.resolving)
	assert_false(view.can_act())
	assert_true(view.end_turn_button.disabled)
	assert_true(view.turn_player.playing)
	var waited: int = 0
	while view.resolving and waited < 600:
		view.select_ability(source, source.abilities[0])
		assert_null(view.selected_state)
		await (Engine.get_main_loop() as SceneTree).process_frame
		waited += 1
	assert_false(view.resolving)
	assert_true(view.can_act())
	AnimConfig.fast = true
	Helpers.unmount(view)


func test_stage_plays_damaged_then_recover_then_returns_to_idle() -> void:
	AnimConfig.fast = false
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var target: Fighter = battle.teams[1].fighters[1]
	var sprite: FighterSprite = view.sprites[target]
	assert_eq(sprite.current_animation(), "idle")
	view.stage.play_impact([target] as Array[Fighter])
	await (Engine.get_main_loop() as SceneTree).process_frame
	assert_eq(sprite.current_animation(), "damaged")
	assert_true(sprite.busy)
	await (Engine.get_main_loop() as SceneTree).create_timer(1.0).timeout
	view.stage.play_recovery([target] as Array[Fighter])
	await (Engine.get_main_loop() as SceneTree).process_frame
	assert_eq(sprite.current_animation(), "recover")
	await (Engine.get_main_loop() as SceneTree).create_timer(0.9).timeout
	assert_eq(sprite.current_animation(), "idle")
	assert_false(sprite.busy)
	AnimConfig.fast = true
	Helpers.unmount(view)


func test_a_dead_target_shows_the_defeated_pose_after_recovery() -> void:
	AnimConfig.fast = false
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var target: Fighter = battle.teams[1].fighters[0]
	var sprite: FighterSprite = view.sprites[target]
	view.stage.play_impact([target] as Array[Fighter])
	await (Engine.get_main_loop() as SceneTree).process_frame
	sprite.set_alive(false)
	assert_eq(sprite.current_animation(), "damaged")
	view.stage.play_recovery([target] as Array[Fighter])
	await (Engine.get_main_loop() as SceneTree).process_frame
	assert_eq(sprite.current_animation(), "defeated")
	AnimConfig.fast = true
	Helpers.unmount(view)


func test_enemy_sprites_are_mirrored_and_allies_are_not() -> void:
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var ally: FighterSprite = view.sprites[battle.teams[0].fighters[0]]
	var enemy: FighterSprite = view.sprites[battle.teams[1].fighters[0]]
	assert_true(ally.sprite.scale.x > 0.0)
	assert_true(enemy.sprite.scale.x < 0.0)
	assert_eq(absf(enemy.sprite.scale.x), ally.sprite.scale.x)
	Helpers.unmount(view)


func test_fast_mode_makes_every_stage_call_instant() -> void:
	AnimConfig.fast = true
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var source: Fighter = battle.teams[0].fighters[0]
	var target: Fighter = battle.teams[1].fighters[0]
	var started: int = Time.get_ticks_msec()
	view.stage.play_attack(source, target, "rasengan")
	view.stage.play_impact([target] as Array[Fighter])
	view.stage.play_recovery([target] as Array[Fighter])
	assert_true(Time.get_ticks_msec() - started < 100)
	Helpers.unmount(view)
