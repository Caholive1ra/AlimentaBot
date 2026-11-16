import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Role(str, enum.Enum):
    DOADOR = "doador"
    GESTOR = "gestor"
    TRANSPORTADOR = "transportador"
    INSTITUICAO = "instituicao"


class OrganizationRole(str, enum.Enum):
    OWNER = "owner"
    DOADOR = "doador"
    GESTOR = "gestor"
    TRANSPORTADOR = "transportador"
    INSTITUICAO = "instituicao"


class Conservation(str, enum.Enum):
    AMBIENTE = "ambiente"
    REFRIGERADO = "refrigerado"
    CONGELADO = "congelado"


class LotStatus(str, enum.Enum):
    PENDENTE_REVISAO = "PENDENTE_REVISAO"
    LIBERADO = "LIBERADO"
    REJEITADO = "REJEITADO"
    RESERVADO = "RESERVADO"
    COLETADO = "COLETADO"
    ENTREGUE = "ENTREGUE"
    RECUSADO = "RECUSADO"


class ReviewDecision(str, enum.Enum):
    APROVADO = "APROVADO"
    REJEITADO = "REJEITADO"


class BaseEntity:
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    is_simulation: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class User(Base, BaseEntity):
    __tablename__ = "users"
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    auth_subject: Mapped[str | None] = mapped_column(String(255), unique=True)
    role: Mapped[Role] = mapped_column(Enum(Role, name="role"), nullable=False)
    authorized_sanitary_reviewer: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    vehicle: Mapped[str | None] = mapped_column(String(160))
    capacity_kg: Mapped[float | None] = mapped_column(Float)
    refrigerated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    memberships: Mapped[list["OrganizationMember"]] = relationship(back_populates="user")


class Organization(Base, BaseEntity):
    __tablename__ = "organizations"
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    members: Mapped[list["OrganizationMember"]] = relationship(back_populates="organization")


class OrganizationMember(Base, BaseEntity):
    __tablename__ = "organization_members"
    __table_args__ = (UniqueConstraint("organization_id", "user_id", "role", name="uq_organization_member_role"),)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role: Mapped[OrganizationRole] = mapped_column(Enum(OrganizationRole, name="organization_role"), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    organization: Mapped[Organization] = relationship(back_populates="members")
    user: Mapped[User] = relationship(back_populates="memberships")


class Institution(Base, BaseEntity):
    __tablename__ = "institutions"
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    neighborhood: Mapped[str] = mapped_column(String(120), nullable=False)
    capacity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    accepted_conservation: Mapped[str] = mapped_column(String(100), nullable=False)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))


class Lot(Base, BaseEntity):
    __tablename__ = "lots"
    item: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    units: Mapped[int | None] = mapped_column(Integer)
    conservation: Mapped[Conservation] = mapped_column(Enum(Conservation, name="conservation"), nullable=False)
    prepared_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    pickup_window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    pickup_window_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    origin: Mapped[str] = mapped_column(String(200), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[LotStatus] = mapped_column(Enum(LotStatus, name="lot_status"), default=LotStatus.PENDENTE_REVISAO, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    donor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    institution_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("institutions.id"))
    transporter_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    distance_km: Mapped[float | None] = mapped_column(Float)
    institution: Mapped[Institution | None] = relationship()
    reviews: Mapped[list["SanitaryReview"]] = relationship(back_populates="lot")
    events: Mapped[list["CustodyEvent"]] = relationship(back_populates="lot", order_by="CustodyEvent.created_at")


class SanitaryReview(Base, BaseEntity):
    __tablename__ = "sanitary_reviews"
    lot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lots.id"), nullable=False)
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    decision: Mapped[ReviewDecision] = mapped_column(Enum(ReviewDecision, name="review_decision"), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    human_authorized: Mapped[bool] = mapped_column(Boolean, nullable=False)
    lot: Mapped[Lot] = relationship(back_populates="reviews")


class Reservation(Base, BaseEntity):
    __tablename__ = "reservations"
    __table_args__ = (UniqueConstraint("lot_id", name="uq_reservation_lot"),)
    lot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lots.id"), nullable=False)
    transporter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), unique=True)


class Pickup(Base, BaseEntity):
    __tablename__ = "pickups"
    lot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lots.id"), nullable=False, unique=True)
    transporter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)


class Delivery(Base, BaseEntity):
    __tablename__ = "deliveries"
    lot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lots.id"), nullable=False, unique=True)
    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("institutions.id"), nullable=False)
    accepted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)


class CustodyEvent(Base, BaseEntity):
    __tablename__ = "custody_events"
    lot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lots.id"), nullable=False)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    actor_role: Mapped[str] = mapped_column(String(30), nullable=False)
    action: Mapped[str] = mapped_column(String(160), nullable=False)
    detail: Mapped[str | None] = mapped_column(Text)
    lot: Mapped[Lot] = relationship(back_populates="events")

