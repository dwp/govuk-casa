# Design decisions

Why we've coded things the way we have.


## Journey Context events

An events mechanism was chosen over anything involving middleware hooks because the context could be changed _anywhere_ within the application, and certain middleware hooks may never get reached before a user is redirected. So the only point at which events are triggered is when `JourneyContext.putContext()` is called - this **should** always be called just before data is comitted to the session.
