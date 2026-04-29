def handle_assets(message: str, is_authenticated: bool = False) -> str:
    if not is_authenticated:
        return (
            "أكيد 🧊 عندنا قسم 3D Assets داخل منصة Human Mind & AI Logic. "
            "بتقدري تتصفحي الموديلات، تشوفي الاسم، الوصف، السعر، ونوع الملف مثل GLB أو GLTF."
        )

    return (
        "🔥 عندنا مجموعة مميزة من 3D Assets داخل المنصة. "
        "بتقدري تستخدميها في مشاريعك مثل الأفلام، الألعاب، أو التصميم المعماري. "
        "الأصول جاهزة للاستخدام، ومعظمها بصيغ مثل GLB وGLTF مع textures. "
        "إذا بدك، بقدر أقترح عليك Assets مناسبة حسب مشروعك 🎯"
    )