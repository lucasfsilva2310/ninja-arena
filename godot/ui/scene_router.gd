extends Node

const SELECT_SCENE: PackedScene = preload("res://ui/character_select.tscn")
const BATTLE_SCENE: PackedScene = preload("res://ui/battle.tscn")

var chosen_team: Array[CharacterData] = []
var current: Node
var seed_override: int = -1

var _host: Node


func attach(host: Node) -> void:
	_host = host


func go_to_select() -> void:
	var screen: CharacterSelect = SELECT_SCENE.instantiate() as CharacterSelect
	screen.team_chosen.connect(go_to_battle)
	_show(screen)


func go_to_battle(team: Array[CharacterData]) -> void:
	chosen_team = team.duplicate()
	var seed_value: int = seed_override if seed_override >= 0 else int(Time.get_unix_time_from_system() * 1000.0)
	var view: BattleView = BATTLE_SCENE.instantiate() as BattleView
	view.ai_rng = Rng.new(seed_value + 1)
	view.bind(MatchFactory.new_match(chosen_team, seed_value))
	view.exit_requested.connect(go_to_select)
	_show(view)


func _show(screen: Node) -> void:
	if current != null:
		current.queue_free()
		current = null
	if _host == null:
		screen.queue_free()
		return
	current = screen
	_host.add_child(screen)
