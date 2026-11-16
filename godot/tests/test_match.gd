extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")
const MAX_TURNS: int = 100


func _abilities() -> Dictionary:
	var strike: AbilityData = Build.hit(20, [Build.R])
	strike.display_name = "Strike"
	var senpu: AbilityData = Build.hit(15, [Build.T])
	senpu.display_name = "Senpu"
	senpu.stacking = true
	var guard: AbilityData = Build.self_cast("Guard", [Build.effect(EffectData.Kind.DAMAGE_REDUCTION, 0, 1, false, true)], 3)
	guard.cost = Build.types([Build.R])
	var zap: AbilityData = Build.ability("Zap", [Build.N], 2, AbilityData.Target.ENEMY, [Build.effect(EffectData.Kind.DAMAGE, 10), Build.stun(1)])
	var mend: AbilityData = Build.heal(15, [Build.R])
	mend.cooldown = 1
	var power: AbilityData = Build.hit(30, [Build.R])
	power.display_name = "Power"
	var morph: AbilityData = Build.ability("Morph", [Build.G], 4, AbilityData.Target.ENEMY, [Build.transform(power, 2, 5)])
	var boost: AbilityData = Build.self_cast("Boost", [Build.buff(10, 3, ["Strike"]), Build.enable(3, ["Finisher"])], 3)
	boost.cost = Build.types([Build.R])
	var finisher: AbilityData = Build.hit(35, [Build.R], 1)
	finisher.display_name = "Finisher"
	finisher.required_enabler = "Boost"
	return {"strike": strike, "senpu": senpu, "guard": guard, "zap": zap, "mend": mend, "morph": morph, "boost": boost, "finisher": finisher}


func _team() -> Team:
	var a: Dictionary = _abilities()
	var members: Array[CharacterData] = [
		Build.character("Brawler", [a["strike"], a["boost"], a["finisher"]]),
		Build.character("Trickster", [a["zap"], a["guard"], a["strike"]]),
		Build.character("Monk", [a["senpu"], a["mend"], a["morph"]]),
	]
	return Team.new(members)


func _random_payment(battle: Battle, team_idx: int, actions: Array[Action], rng: Rng) -> Array[ChakraType.Type]:
	var work: Array[ChakraType.Type] = battle.teams[team_idx].pool.chakras.duplicate()
	var random_slots: int = 0
	for action: Action in actions:
		for type: ChakraType.Type in action.ability.data.cost:
			if type == ChakraType.Type.RANDOM:
				random_slots += 1
			else:
				work.remove_at(work.find(type))
	rng.shuffle(work)
	var payment: Array[ChakraType.Type] = []
	for i: int in random_slots:
		payment.append(work[i])
	return payment


func _bot_actions(battle: Battle, team_idx: int, rng: Rng) -> Array[Action]:
	var actions: Array[Action] = []
	for fighter: Fighter in battle.teams[team_idx].living_fighters():
		var options: Array[AbilityState] = fighter.abilities.duplicate()
		rng.shuffle(options)
		for state: AbilityState in options:
			if not state.is_ready():
				continue
			var targets: Array[Fighter] = battle.valid_targets(team_idx, fighter, state)
			if targets.is_empty():
				continue
			var candidate: Array[Action] = actions.duplicate()
			candidate.append(Action.new(fighter, state, rng.pick(targets)))
			if battle.can_afford_queue(team_idx, candidate):
				actions = candidate
				break
	return actions


func _line(event: BattleEvent) -> String:
	var source: String = event.source.display_name() if event.source != null else "-"
	var target: String = event.target.display_name() if event.target != null else "-"
	return "%d|%s|%s|%d|%s" % [event.type, source, target, event.amount, event.text]


func _play(seed_value: int) -> Dictionary:
	var battle: Battle = Battle.new(_team(), _team(), Rng.new(seed_value))
	var bot_rng: Rng = Rng.new(seed_value + 1000)
	var log: Array[String] = []
	var invariant_errors: Array[String] = []
	for event: BattleEvent in battle.start():
		log.append(_line(event))
	var turns_played: int = 0
	while not battle.result.ended and turns_played < MAX_TURNS:
		turns_played += 1
		var team_idx: int = battle.current_team
		var actions: Array[Action] = _bot_actions(battle, team_idx, bot_rng)
		var payment: Array[ChakraType.Type] = _random_payment(battle, team_idx, actions, bot_rng)
		var events: Array[BattleEvent] = battle.submit_turn(team_idx, actions, payment)
		for event: BattleEvent in events:
			log.append(_line(event))
			if event.type == BattleEvent.Type.REJECTED:
				invariant_errors.append("rejected: %s" % event.text)
		for team: Team in battle.teams:
			for fighter: Fighter in team.fighters:
				if fighter.hp < 0 or fighter.hp > Fighter.MAX_HP:
					invariant_errors.append("hp out of range: %d" % fighter.hp)
			for type: ChakraType.Type in ChakraType.real_types():
				if team.pool.count(type) < 0:
					invariant_errors.append("negative chakra")
			if team.pool.total() < 0:
				invariant_errors.append("negative chakra total")
	return {"battle": battle, "log": log, "errors": invariant_errors, "turns": turns_played}


func test_match_ends_within_100_turns() -> void:
	for seed_value: int in [1, 2, 3, 4, 5]:
		var played: Dictionary = _play(seed_value)
		var battle: Battle = played["battle"]
		assert_true(battle.result.ended)
		assert_true(played["turns"] <= MAX_TURNS)


func test_match_keeps_hp_and_chakra_in_range_with_no_rejected_turns() -> void:
	for seed_value: int in [1, 2, 3, 4, 5, 6, 7, 8]:
		var played: Dictionary = _play(seed_value)
		var errors: Array[String] = played["errors"]
		assert_eq(errors.size(), 0)


func test_same_seed_gives_identical_event_log() -> void:
	var first: Dictionary = _play(42)
	var second: Dictionary = _play(42)
	assert_eq(first["log"], second["log"])
	assert_true(first["log"].size() > 10)


func test_different_seeds_give_different_event_logs() -> void:
	var logs: Array = []
	for seed_value: int in [1, 2, 3, 4]:
		var played: Dictionary = _play(seed_value)
		assert_false(logs.has(played["log"]))
		logs.append(played["log"])


func test_match_uses_every_effect_type() -> void:
	var seen: Dictionary = {}
	for seed_value: int in range(1, 9):
		var played: Dictionary = _play(seed_value)
		for line: String in played["log"]:
			seen[line.get_slice("|", 0)] = true
	assert_true(seen.has(str(BattleEvent.Type.EFFECT_ADDED)))
	assert_true(seen.has(str(BattleEvent.Type.EFFECT_EXPIRED)))
	assert_true(seen.has(str(BattleEvent.Type.REDUCTION_ADDED)))
	assert_true(seen.has(str(BattleEvent.Type.HEAL)))
