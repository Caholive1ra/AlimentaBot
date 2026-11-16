"""Create the first platform administrator from a controlled shell only.

Run only after Auth0 identity verification: python -m app.cli.bootstrap_admin --subject auth0|... --name "..." --organization "..."
"""
import argparse

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models import AccessAuditEvent, Organization, OrganizationMember, OrganizationRole, Role, User


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap the first AlimentaBot platform administrator")
    parser.add_argument("--subject", required=True, help="Verified Auth0 subject (sub), never an email")
    parser.add_argument("--name", required=True)
    parser.add_argument("--organization", required=True)
    args = parser.parse_args()
    db = SessionLocal()
    try:
        if db.scalar(select(User).where(User.auth_subject == args.subject)):
            raise SystemExit("A identidade já está provisionada; use o fluxo de convite ou revogação.")
        org = db.scalar(select(Organization).where(Organization.name == args.organization))
        if not org:
            org = Organization(name=args.organization, is_simulation=False)
            db.add(org)
            db.flush()
        user = User(name=args.name, auth_subject=args.subject, role=Role.ADMIN_PLATAFORMA, is_simulation=False)
        db.add(user)
        db.flush()
        db.add(OrganizationMember(organization_id=org.id, user_id=user.id, role=OrganizationRole.ADMIN_PLATAFORMA, is_simulation=False))
        db.add(AccessAuditEvent(actor_id=user.id, target_user_id=user.id, organization_id=org.id, action="BOOTSTRAP_ADMINISTRADOR_PLATAFORMA", detail="Executado por CLI controlada", is_simulation=False))
        db.commit()
        print(f"Administrador provisionado para organização {org.id}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
