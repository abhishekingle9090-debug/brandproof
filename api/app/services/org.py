from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import FirebaseUser
from ..models import Membership, Organisation


DEMO_ORG_NAME = "Acme Fit"


async def get_or_create_org(db: AsyncSession, user: FirebaseUser) -> UUID:
    """Return the org for this user. If none exists, join the demo org or create one."""
    result = await db.execute(
        select(Membership).where(Membership.firebase_uid == user.uid)
    )
    membership = result.scalar_one_or_none()
    if membership:
        return membership.org_id

    # New user → link to demo org if it exists, else create a new org
    demo = (await db.execute(
        select(Organisation).where(Organisation.name == DEMO_ORG_NAME)
    )).scalar_one_or_none()

    if demo is not None:
        org_id = demo.id
        role = "brand_manager"
    else:
        org = Organisation(name="Demo Org")
        db.add(org)
        await db.flush()
        org_id = org.id
        role = "brand_manager"

    db.add(Membership(org_id=org_id, firebase_uid=user.uid, role=role))
    await db.commit()
    return org_id