class ServiceError(Exception):
    """Business error carrying the HTTP status the API should answer with."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class NotFound(ServiceError):
    def __init__(self, message: str = "Ressource introuvable.") -> None:
        super().__init__(message, 404)


class Conflict(ServiceError):
    def __init__(self, message: str) -> None:
        super().__init__(message, 409)


class Forbidden(ServiceError):
    def __init__(self, message: str = "Action non autorisée.") -> None:
        super().__init__(message, 403)
