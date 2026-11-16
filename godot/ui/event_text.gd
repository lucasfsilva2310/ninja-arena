class_name EventText
extends RefCounted


static func describe(event: BattleEvent) -> String:
	match event.type:
		BattleEvent.Type.TURN_STARTED:
			return "--- Turn %d ---" % event.amount
		BattleEvent.Type.ABILITY_USED:
			if event.target != null and event.target != event.source:
				return "%s uses %s on %s." % [_name(event.source), event.text, _name(event.target)]
			return "%s uses %s." % [_name(event.source), event.text]
		BattleEvent.Type.DAMAGE:
			return "%s takes %d damage from %s." % [_name(event.target), event.amount, event.text]
		BattleEvent.Type.HEAL:
			return "%s heals %d HP (%s)." % [_name(event.target), event.amount, event.text]
		BattleEvent.Type.REDUCTION_ADDED:
			return "%s gains damage reduction (%s)." % [_name(event.target), event.text]
		BattleEvent.Type.REDUCTION_EXPIRED:
			return "%s: damage reduction from %s ended." % [_name(event.target), event.text]
		BattleEvent.Type.FIGHTER_DIED:
			return "%s is defeated." % _name(event.target)
		BattleEvent.Type.BATTLE_ENDED:
			return "Battle over: %s." % event.text
		BattleEvent.Type.REJECTED:
			return "Turn rejected: %s." % event.text
		BattleEvent.Type.EFFECT_ADDED:
			return "%s: %s" % [_name(event.target), event.text]
		BattleEvent.Type.EFFECT_EXPIRED:
			return "%s: %s" % [_name(event.target), event.text]
		_:
			return ""


static func _name(fighter: Fighter) -> String:
	return fighter.display_name() if fighter != null else "?"
