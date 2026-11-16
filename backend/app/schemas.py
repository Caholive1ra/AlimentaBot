import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models import Conservation, LotStatus, OrganizationRole, ReviewDecision


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class LotCreate(Schema):
    item: str = Field(min_length=3, max_length=200)
    category: str
    quantity_kg: float = Field(gt=0, le=500)
    units: int | None = Field(default=None, ge=0)
    conservation: Conservation
    prepared_at: datetime
    expires_at: datetime
    pickup_window_start: datetime
    pickup_window_end: datetime
    origin: str = Field(min_length=3, max_length=200)
    notes: str | None = None
    donor_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def validate_safety_window(self):
        now = datetime.now(self.expires_at.tzinfo)
        if self.prepared_at > now or self.expires_at <= now:
            raise ValueError("datas de preparo ou validade inválidas")
        if self.pickup_window_end <= self.pickup_window_start or self.pickup_window_end > self.expires_at:
            raise ValueError("janela de retirada inválida")
        if self.category == "refeicao_pronta" and self.conservation == Conservation.AMBIENTE:
            raise ValueError("refeição pronta exige refrigeração ou congelamento")
        return self


class OperationalLotCreate(LotCreate):
    donor_id: uuid.UUID | None = None


class LotUpdate(Schema):
    item: str | None = Field(default=None, min_length=3, max_length=200)
    quantity_kg: float | None = Field(default=None, gt=0, le=500)
    notes: str | None = Field(default=None, max_length=2000)


class LotRead(Schema):
    id: uuid.UUID
    item: str
    category: str
    quantity_kg: float
    conservation: Conservation
    status: LotStatus
    expires_at: datetime
    institution_id: uuid.UUID | None
    transporter_id: uuid.UUID | None
    is_simulation: bool


class Page(Schema):
    items: list[LotRead]
    next_cursor: str | None = None


class ReviewCreate(Schema):
    decision: ReviewDecision
    institution_id: uuid.UUID | None = None
    reason: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def require_destination_or_reason(self):
        if self.decision == ReviewDecision.APROVADO and not self.institution_id:
            raise ValueError("aprovação exige instituição de destino")
        if self.decision == ReviewDecision.REJEITADO and not (self.reason or "").strip():
            raise ValueError("rejeição exige motivo")
        return self


class ReservationCreate(Schema):
    transporter_id: uuid.UUID


class DeliveryCreate(Schema):
    accepted: bool
    reason: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def require_reason_on_refusal(self):
        if not self.accepted and not (self.reason or "").strip():
            raise ValueError("recusa exige motivo")
        return self


class CustodyEventRead(Schema):
    id: uuid.UUID
    lot_id: uuid.UUID
    actor_role: str
    action: str
    detail: str | None
    created_at: datetime
    is_simulation: bool


PUBLIC_REQUEST_ROLES = {
    OrganizationRole.DOADOR,
    OrganizationRole.TRANSPORTADOR,
    OrganizationRole.INSTITUICAO,
}


class PublicRegistrationRequest(Schema):
    requested_role: OrganizationRole
    organization_name: str = Field(min_length=3, max_length=160)

    @model_validator(mode="after")
    def only_public_operating_roles(self):
        if self.requested_role not in PUBLIC_REQUEST_ROLES:
            raise ValueError("papel administrativo não pode ser solicitado publicamente")
        return self


class InvitationCreate(Schema):
    recipient_subject: str = Field(min_length=3, max_length=255)
    role: OrganizationRole
    expires_at: datetime


class InvitationAccept(Schema):
    token: str = Field(min_length=32, max_length=512)
    name: str = Field(min_length=2, max_length=160)


class InvitationRead(Schema):
    id: uuid.UUID
    organization_id: uuid.UUID
    recipient_subject: str
    role: OrganizationRole
    expires_at: datetime
    accepted_at: datetime | None
    revoked_at: datetime | None


class InvitationIssued(InvitationRead):
    token: str
