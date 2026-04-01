# PARCHE PARA main.py — AGREGAR ESTAS LÍNEAS EN LOS LUGARES INDICADOS
# No reemplaces el main.py completo — solo añadí esto

# 1) En la clase UpdateConfigRequest, agregá al final:
#    hf_api_key: Optional[str] = None        ← ya lo tenés
#    negocio_info: Optional[str] = None      ← AGREGAR ESTO

# 2) En el endpoint PUT /user/config, dentro del if/else de campos, agregá:
#    if hasattr(req, "negocio_info") and req.negocio_info is not None:
#        cfg.negocio_info = req.negocio_info

# 3) En GET /user/config, en el return, agregá:
#    "negocio_info": cfg.negocio_info or "",

# 4) En los endpoints de agentes que llaman analyze_campaigns, analyze_finances, etc.,
#    pasá negocio_info así:
#    negocio_info = cfg.negocio_info or "" if cfg else ""
#    analyze_campaigns(camps, negocio_info=negocio_info)

# ─────────────────────────────────────────────────────────────
# EJEMPLO DE CÓMO QUEDAN LOS ENDPOINTS DE AGENTES:

# @app.get("/agent/optimize")
# def optimize(user: models.User = Depends(get_current_user)):
#     cfg = init_meta_for_user(user)
#     aid = cfg.active_account_id or cfg.meta_ad_account_id
#     negocio_info = user.config.negocio_info or "" if user.config else ""
#     try:
#         camps = get_campaigns_with_metrics(aid)
#         return {"analysis": analyze_campaigns(camps, negocio_info=negocio_info), "campaigns_analyzed": len(camps)}
#     except Exception as e:
#         raise HTTPException(500, str(e))
