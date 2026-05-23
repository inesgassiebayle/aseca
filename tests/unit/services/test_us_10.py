from datetime import datetime, timezone
from app.models.models import Operation


class TestHistorialService:

    def test_historial_retorna_todas_operaciones(self, portfolio_service, db):
        ops = [
            Operation(id=1, user_id=1, ticker="AAPL", type="buy", quantity=10, price=214.30, executed_at=datetime.now(timezone.utc)),
            Operation(id=2, user_id=1, ticker="MSFT", type="buy", quantity=5, price=428.55, executed_at=datetime.now(timezone.utc)),
        ]
        db.query.return_value.filter.return_value.order_by.return_value.all.return_value = ops

        result = portfolio_service.get_operations(user_id=1)

        assert len(result) == 2

    def test_historial_filtrado_por_ticker(self, portfolio_service, db):
        aapl_ops = [
            Operation(id=1, user_id=1, ticker="AAPL", type="buy", quantity=10, price=214.30, executed_at=datetime.now(timezone.utc)),
        ]
        db.query.return_value.filter.return_value.filter.return_value.order_by.return_value.all.return_value = aapl_ops

        result = portfolio_service.get_operations(user_id=1, ticker="AAPL")

        assert all(op.ticker == "AAPL" for op in result)

    def test_historial_vacio(self, portfolio_service, db):
        db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []

        result = portfolio_service.get_operations(user_id=1)

        assert result == []