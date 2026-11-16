class_name MatchFactory
extends RefCounted


static func new_match(player_team: Array[CharacterData], seed_value: int) -> Battle:
	var battle: Battle = Battle.new(Team.new(player_team), Team.new(Content.ai_roster()), Rng.new(seed_value))
	battle.start()
	return battle


static func default_team() -> Array[CharacterData]:
	var team: Array[CharacterData] = []
	var all: Array[CharacterData] = Content.characters()
	for i: int in 3:
		team.append(all[i])
	return team
