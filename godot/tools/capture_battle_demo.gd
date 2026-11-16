extends Control

const TURNS: int = 5


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var battle: Battle = MatchFactory.new_match(MatchFactory.default_team(), 11)
	var rng: Rng = Rng.new(5)
	var ai: AiPlayer = AiPlayer.new()
	for i: int in TURNS:
		var team_idx: int = battle.current_team
		var plan: TurnPlan = ai.plan_turn(battle, team_idx, rng)
		battle.submit_turn(team_idx, plan.actions, plan.random_payment)
	if battle.current_team != 0:
		battle.submit_turn(1, [] as Array[Action], [] as Array[ChakraType.Type])
	var view: BattleView = (load("res://ui/battle.tscn") as PackedScene).instantiate() as BattleView
	view.background_name = "forest"
	view.bind(battle)
	add_child(view)
	view.show_ability(battle.teams[0].fighters[0].abilities[1])
