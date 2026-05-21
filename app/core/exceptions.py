class EmailAlreadyExistsError(Exception):
    def __init__(self):
        super().__init__("email already exists")


class WeakPasswordError(Exception):
    def __init__(self):
        super().__init__("password must be at least 8 characters")


class InvalidCredentialsError(Exception):
    def __init__(self):
        super().__init__("invalid credentials")

class TickerNotFoundError(Exception):
    pass

class InsufficientSharesError(Exception):
    pass