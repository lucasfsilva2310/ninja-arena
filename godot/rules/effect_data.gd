class_name EffectData
extends Resource

enum Kind { DAMAGE, HEAL, DAMAGE_REDUCTION }

@export var kind: Kind = Kind.DAMAGE
@export var value: int = 0
@export var duration: int = 0
@export var is_percent: bool = false
@export var invulnerable: bool = false
