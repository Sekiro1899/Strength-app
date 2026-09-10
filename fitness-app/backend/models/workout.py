from pydantic import BaseModel, Field


class WorkoutRequest(BaseModel):
    user_id: str
    user_program_id: str
    persona_id: str
    program_id: str
    phase_id: str | None = None
    week_number: int = 1
    day_number: int = 1
    protocol: str | None = None
    focus: str | None = None
    energy_level: int = Field(default=3, ge=1, le=5)
    # Lieu déclaré en début de séance — décide du matériel disponible.
    location: str = "gym"
    # Créneau annoncé : "short" (pressé) ou "standard". Il plafonne le volume
    # même quand l'énergie déclarée est haute, et met les compounds en superset
    # antagoniste. Un troisième palier « large » ne changeait rien à la
    # composition — il ne faisait qu'ajouter une question sans conséquence.
    time_budget: str = "standard"
    available_equipment: list[str] = []


class ExerciseScaling(BaseModel):
    """Progression d'un mouvement au poids de corps — voir engine/scaling.py."""

    # Vers le haut — ceinture lestée, gilet.
    harder: str
    # Vers le bas — élastique, variante assistée.
    easier: str
    # Démonstration de la variante allégée.
    video_url: str | None = None
    # Terme de recherche vidéo quand aucun lien n'est encore indexé.
    video_query: str


class ExerciseBlock(BaseModel):
    exercise_id: str
    name: str
    sets: int
    reps: int | None = None
    # Borne haute quand la prescription est une plage (10-12 plutôt que 11).
    reps_max: int | None = None
    duration_sec: int | None = None
    load_pct_1rm: int | None = None
    rest_sec: int | None = None
    superset_with: str | None = None
    notes: str | None = None
    # False sur warmup et finisher : le client n'y propose pas de saisie.
    log_results: bool = True
    # Nom du protocole de force quand la prescription en suit un (5x5, 3x5).
    # Purement informatif : la charge et les séries sont déjà dans le bloc.
    protocol_label: str | None = None
    # Comment monter ou descendre en difficulté — voir engine/scaling.py.
    scaling: ExerciseScaling | None = None


class WorkoutResponse(BaseModel):
    session_id: str
    program_id: str
    phase_id: str | None
    protocol: str
    focus: str
    session_label: str
    warmup_block: list[ExerciseBlock]
    main_block: list[ExerciseBlock]
    core_block: list[ExerciseBlock]
    finisher_block: list[ExerciseBlock]
