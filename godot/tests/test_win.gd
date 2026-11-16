extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")


func _blast() -> AbilityData:
	return Build.ability("Blast", [], 0, AbilityData.Target.ALL_ENEMIES, [Build.effect(EffectData.Kind.DAMAGE, 100)])


func _self_blast() -> AbilityData:
	return Build.ability("Reckless", [], 0, AbilityData.Target.ALL_ALLIES, [Build.effect(EffectData.Kind.DAMAGE, 100)])


func test_no_winner_while_both_teams_have_living_fighters() -> void:
	var battle: Battle = Build.battle(Build.team([]), Build.team([]))
	var outcome: BattleResult = battle.check_winner()
	assert_false(outcome.ended)
	assert_false(outcome.draw)


func test_single_team_wiped_ends_battle_with_winner() -> void:
	var battle: Battle = Build.battle(Build.team([_blast()]), Build.team([]))
	var ended: Array[BattleResult] = []
	battle.battle_ended.connect(func(r: BattleResult) -> void: ended.append(r))
	var caster: Fighter = battle.teams[0].fighters[0]
	var events: Array[BattleEvent] = battle.submit_turn(0, Build.actions([Action.new(caster, caster.abilities[0])]), Build.empty_payment())
	assert_eq(ended.size(), 1)
	assert_true(ended[0].ended)
	assert_eq(ended[0].winner, 0)
	assert_false(ended[0].draw)
	assert_true(battle.teams[1].is_defeated())
	assert_eq(events[events.size() - 1].type, BattleEvent.Type.BATTLE_ENDED)


func test_second_team_can_win() -> void:
	var battle: Battle = Build.battle(Build.team([]), Build.team([_blast()]))
	Build.skip_turn(battle)
	var caster: Fighter = battle.teams[1].fighters[0]
	battle.submit_turn(1, Build.actions([Action.new(caster, caster.abilities[0])]), Build.empty_payment())
	assert_eq(battle.result.winner, 1)


func test_both_teams_wiped_in_one_resolution_is_a_draw() -> void:
	var members: Array[CharacterData] = [
		Build.character("Killer", [_blast()]),
		Build.character("Reckless", [_self_blast()]),
		Build.character("Bystander", []),
	]
	var battle: Battle = Build.battle(Team.new(members), Build.team([]))
	var ended: Array[BattleResult] = []
	battle.battle_ended.connect(func(r: BattleResult) -> void: ended.append(r))
	var killer: Fighter = battle.teams[0].fighters[0]
	var reckless: Fighter = battle.teams[0].fighters[1]
	var queue: Array[Action] = Build.actions([
		Action.new(killer, killer.abilities[0]),
		Action.new(reckless, reckless.abilities[0]),
	])
	battle.submit_turn(0, queue, Build.empty_payment())
	assert_eq(ended.size(), 1)
	assert_true(ended[0].draw)
	assert_eq(ended[0].winner, -1)
	assert_true(battle.teams[0].is_defeated())
	assert_true(battle.teams[1].is_defeated())


func test_submit_after_battle_end_is_rejected() -> void:
	var battle: Battle = Build.battle(Build.team([_blast()]), Build.team([]))
	var caster: Fighter = battle.teams[0].fighters[0]
	battle.submit_turn(0, Build.actions([Action.new(caster, caster.abilities[0])]), Build.empty_payment())
	var events: Array[BattleEvent] = battle.submit_turn(1, Build.actions([]), Build.empty_payment())
	assert_eq(events[0].type, BattleEvent.Type.REJECTED)


func test_scripted_match_with_damage_and_heal_reaches_a_winner() -> void:
	var attackers: Team = Build.team([Build.hit(15)])
	var defenders: Team = Build.team([Build.heal(10), Build.hit(5)])
	var battle: Battle = Build.battle(attackers, defenders)
	var guard: int = 0
	var healed_total: int = 0
	while not battle.result.ended and guard < 40:
		guard += 1
		var queue: Array[Action] = []
		if battle.current_team == 0:
			var enemy: Fighter = defenders.living_fighters()[0]
			for fighter: Fighter in attackers.living_fighters():
				queue.append(Action.new(fighter, fighter.abilities[0], enemy))
		else:
			for patient: Fighter in defenders.living_fighters():
				if not patient.is_full_hp():
					var healer: Fighter = defenders.living_fighters()[0]
					queue.append(Action.new(healer, healer.abilities[0], patient))
					break
		var events: Array[BattleEvent] = battle.submit_turn(battle.current_team, queue, Build.empty_payment())
		for event: BattleEvent in events:
			assert_ne(event.type, BattleEvent.Type.REJECTED)
			if event.type == BattleEvent.Type.HEAL:
				healed_total += event.amount
	assert_true(battle.result.ended)
	assert_eq(battle.result.winner, 0)
	assert_true(defenders.is_defeated())
	assert_false(attackers.is_defeated())
	assert_true(healed_total > 0)
