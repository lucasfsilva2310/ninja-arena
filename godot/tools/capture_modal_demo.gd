extends Control

const TURNS: int = 5


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var args: PackedStringArray = OS.get_cmdline_user_args()
	var kind: String = args[3] if args.size() > 3 else "exchange"
	var battle: Battle = MatchFactory.new_match(MatchFactory.default_team(), 11)
	var rng: Rng = Rng.new(5)
	var ai: AiPlayer = AiPlayer.new()
	for i: int in TURNS:
		var team_idx: int = battle.current_team
		var plan: TurnPlan = ai.plan_turn(battle, team_idx, rng)
		battle.submit_turn(team_idx, plan.actions, plan.random_payment)
	if battle.current_team != 0:
		battle.submit_turn(1, [] as Array[Action], [] as Array[ChakraType.Type])
	var pool: ChakraPool = battle.teams[0].pool
	pool.chakras.clear()
	for type: ChakraType.Type in [0, 0, 0, 1, 1, 2, 3, 3]:
		pool.add(type)
	var view: BattleView = (load("res://ui/battle.tscn") as PackedScene).instantiate() as BattleView
	view.background_name = "forest"
	view.bind(battle)
	add_child(view)
	match kind:
		"exchange":
			view.open_exchange()
			var exchange: ExchangeModal = view.modal as ExchangeModal
			for type: ChakraType.Type in [0, 0, 1, 3]:
				exchange.picker.add_chakra(type)
			exchange.pick_target(ChakraType.Type.BLOODLINE)
		"exchange-ready":
			view.open_exchange()
			var ready: ExchangeModal = view.modal as ExchangeModal
			for type: ChakraType.Type in [0, 0, 0, 1, 1]:
				ready.picker.add_chakra(type)
			ready.pick_target(ChakraType.Type.GENJUTSU)
		"payment":
			var fighter: Fighter = battle.teams[0].fighters[0]
			var state: AbilityState = _random_cost_state(fighter)
			view.queue.try_add(Action.new(fighter, state, battle.teams[1].fighters[0]))
			view.end_turn()
			(view.modal as PaymentModal).picker.add_chakra(ChakraType.Type.TAIJUTSU)
		"surrender":
			view.open_surrender()
		"history":
			for i: int in 30:
				view.history.append("--- Turn %d ---" % (i + 1))
				view.history.append("Naruto uses Naruto Kick on Sasuke.")
			view.open_history()
		_:
			pass


func _random_cost_state(fighter: Fighter) -> AbilityState:
	for state: AbilityState in fighter.abilities:
		if state.data.cost.has(ChakraType.Type.RANDOM) and state.data.target_type == AbilityData.Target.ENEMY:
			return state
	return fighter.abilities[0]
