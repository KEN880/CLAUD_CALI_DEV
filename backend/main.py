from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import clients, calculator, products, orders, tnved, manufacturers

app = FastAPI(title="CALI — Certification Automation", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router)
app.include_router(manufacturers.router)
app.include_router(calculator.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(tnved.router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
