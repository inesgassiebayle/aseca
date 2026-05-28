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

class PositionNotFoundError(Exception):
    pass

class TickerAlreadyInWatchlistError(Exception):
    def __init__(self, ticker: str):
        super().__init__(f"{ticker} already in watchlist")

class TickerNotInWatchlistError(Exception):
    def __init__(self, ticker: str):
        super().__init__(f"{ticker} not in watchlist")