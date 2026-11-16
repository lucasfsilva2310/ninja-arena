extends "res://tools/test_case.gd"

const MATCH_COUNT: int = 1000
const SPEC_TURNS: int = 200
const MAX_TURNS: int = 1000
const MIN_WITHIN_SPEC: int = 990


func _play(seed_value: int) -> Dictionary:
	var battle: Battle = Battle.new(Team.new(Content.ai_roster()), Team.new(Content.ai_roster()), Rng.new(seed_value))
	var ai_rng: Rng = Rng.new(seed_value + 100000)
	var ai: AiPlayer = AiPlayer.new()
	battle.start()
	var problems: Array[String] = []
	var turns: int = 0
	while not battle.result.ended and turns < MAX_TURNS:
		turns += 1
		var team_idx: int = battle.current_team
		var plan: TurnPlan = ai.plan_turn(battle, team_idx, ai_rng)
		var events: Array[BattleEvent] = battle.submit_turn(team_idx, plan.actions, plan.random_payment)
		for event: BattleEvent in events:
			if event.type == BattleEvent.Type.REJECTED:
				problems.append("rejected: %s" % event.text)
		for team: Team in battle.teams:
			for type: ChakraType.Type in team.pool.chakras:
				if type == ChakraType.Type.RANDOM:
					problems.append("random chakra in pool")
			for fighter: Fighter in team.fighters:
				if fighter.hp < 0 or fighter.hp > Fighter.MAX_HP:
					problems.append("hp out of range")
	return {"battle": battle, "turns": turns, "problems": problems}


func test_thousand_ai_vs_ai_matches_all_end_with_a_winner() -> void:
	var wins: Array[int] = [0, 0]
	var draws: int = 0
	var unfinished: int = 0
	var problems: int = 0
	var longest: int = 0
	var within_spec: int = 0
	var started: int = Time.get_ticks_msec()
	for seed_value: int in MATCH_COUNT:
		var played: Dictionary = _play(seed_value)
		var battle: Battle = played["battle"]
		var seed_problems: Array[String] = played["problems"]
		problems += seed_problems.size()
		longest = maxi(longest, int(played["turns"]))
		if int(played["turns"]) <= SPEC_TURNS:
			within_spec += 1
		if not battle.result.ended:
			unfinished += 1
		elif battle.result.draw:
			draws += 1
		else:
			wins[battle.result.winner] += 1
	print("AI_MATCHES count=%d team0_wins=%d team1_wins=%d draws=%d unfinished=%d within_%d=%d longest=%d ms=%d" % [MATCH_COUNT, wins[0], wins[1], draws, unfinished, SPEC_TURNS, within_spec, longest, Time.get_ticks_msec() - started])
	assert_eq(problems, 0)
	assert_eq(unfinished, 0)
	assert_eq(draws, 0)
	assert_true(within_spec >= MIN_WITHIN_SPEC)
	assert_eq(wins[0] + wins[1], MATCH_COUNT)


func test_same_seed_gives_same_ai_match() -> void:
	var first: Dictionary = _play(77)
	var second: Dictionary = _play(77)
	var first_battle: Battle = first["battle"]
	var second_battle: Battle = second["battle"]
	assert_eq(first["turns"], second["turns"])
	assert_eq(first_battle.result.winner, second_battle.result.winner)
	for team_idx: int in 2:
		for i: int in 3:
			assert_eq(first_battle.teams[team_idx].fighters[i].hp, second_battle.teams[team_idx].fighters[i].hp)
