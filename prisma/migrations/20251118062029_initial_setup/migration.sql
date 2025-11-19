-- CreateTable
CREATE TABLE "carrito" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "estado" VARCHAR(30) DEFAULT 'activo',
    "creado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "identificador" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupon" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "tipo_descuento" VARCHAR(20) NOT NULL,
    "valor_descuento" DECIMAL(12,2) NOT NULL,
    "monto_minimo" DECIMAL(12,2),
    "descuento_maximo" DECIMAL(12,2),
    "usos_maximos" INTEGER DEFAULT 1,
    "usos_actuales" INTEGER NOT NULL DEFAULT 0,
    "fecha_inicio" TIMESTAMPTZ(6),
    "fecha_fin" TIMESTAMPTZ(6),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_carrito" (
    "id" SERIAL NOT NULL,
    "carrito_id" INTEGER,
    "producto_id" INTEGER,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "variacion_id" INTEGER NOT NULL,

    CONSTRAINT "item_carrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_pedido" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER,
    "producto_id" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "variacion_id" INTEGER NOT NULL,

    CONSTRAINT "item_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago_simulado" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER,
    "metodo" VARCHAR(50),
    "estado_pago" VARCHAR(30),
    "referencia" VARCHAR(200),
    "creado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_simulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "total" DECIMAL(12,2) NOT NULL,
    "estado" VARCHAR(30) DEFAULT 'pendiente',
    "nombre_receptor" VARCHAR(150),
    "direccion_envio" VARCHAR(255),
    "ciudad" VARCHAR(100),
    "region" VARCHAR(100),
    "pais" VARCHAR(100),
    "telefono_contacto" VARCHAR(50),
    "codigo_tracking" VARCHAR(100),
    "agencia_envio" VARCHAR(100),
    "tiempo_estimado_entrega" VARCHAR(100),
    "cupon_id" INTEGER,
    "creado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "imagenes" JSONB,
    "categoria_id" INTEGER,
    "temporada_id" INTEGER,
    "slug" VARCHAR(200),
    "creado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variacion_producto" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "talla" TEXT,
    "color" TEXT,
    "stock" INTEGER DEFAULT 0,
    "sku" TEXT,

    CONSTRAINT "variacion_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporada" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "inicio" DATE,
    "fin" DATE,

    CONSTRAINT "temporada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "contrasena" VARCHAR(255) NOT NULL,
    "dni" VARCHAR(20),
    "direccion" VARCHAR(255),
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "rol" VARCHAR(20) NOT NULL DEFAULT 'cliente',
    "telefono" VARCHAR(50),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "producto_id" INTEGER,
    "creado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_token" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "carrito_usuario_id_idx" ON "carrito"("usuario_id");

-- CreateIndex
CREATE INDEX "carrito_estado_idx" ON "carrito"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_identificador_key" ON "categoria"("identificador");

-- CreateIndex
CREATE UNIQUE INDEX "cupon_codigo_key" ON "cupon"("codigo");

-- CreateIndex
CREATE INDEX "cupon_codigo_idx" ON "cupon"("codigo");

-- CreateIndex
CREATE INDEX "cupon_activo_idx" ON "cupon"("activo");

-- CreateIndex
CREATE INDEX "cupon_fecha_fin_idx" ON "cupon"("fecha_fin");

-- CreateIndex
CREATE INDEX "item_carrito_carrito_id_idx" ON "item_carrito"("carrito_id");

-- CreateIndex
CREATE INDEX "item_carrito_producto_id_idx" ON "item_carrito"("producto_id");

-- CreateIndex
CREATE INDEX "item_carrito_variacion_id_idx" ON "item_carrito"("variacion_id");

-- CreateIndex
CREATE INDEX "item_pedido_pedido_id_idx" ON "item_pedido"("pedido_id");

-- CreateIndex
CREATE INDEX "item_pedido_producto_id_idx" ON "item_pedido"("producto_id");

-- CreateIndex
CREATE INDEX "item_pedido_variacion_id_idx" ON "item_pedido"("variacion_id");

-- CreateIndex
CREATE INDEX "pedido_usuario_id_idx" ON "pedido"("usuario_id");

-- CreateIndex
CREATE INDEX "pedido_estado_idx" ON "pedido"("estado");

-- CreateIndex
CREATE INDEX "pedido_creado_en_idx" ON "pedido"("creado_en");

-- CreateIndex
CREATE INDEX "pedido_cupon_id_idx" ON "pedido"("cupon_id");

-- CreateIndex
CREATE UNIQUE INDEX "producto_slug_key" ON "producto"("slug");

-- CreateIndex
CREATE INDEX "producto_categoria_id_idx" ON "producto"("categoria_id");

-- CreateIndex
CREATE INDEX "producto_temporada_id_idx" ON "producto"("temporada_id");

-- CreateIndex
CREATE INDEX "producto_creado_en_idx" ON "producto"("creado_en");

-- CreateIndex
CREATE INDEX "variacion_producto_producto_id_idx" ON "variacion_producto"("producto_id");

-- CreateIndex
CREATE INDEX "variacion_producto_sku_idx" ON "variacion_producto"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "temporada_nombre_key" ON "temporada"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_dni_key" ON "usuario"("dni");

-- CreateIndex
CREATE INDEX "usuario_email_idx" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_dni_idx" ON "usuario"("dni");

-- CreateIndex
CREATE INDEX "usuario_rol_idx" ON "usuario"("rol");

-- CreateIndex
CREATE INDEX "wishlist_usuario_id_idx" ON "wishlist"("usuario_id");

-- CreateIndex
CREATE INDEX "wishlist_producto_id_idx" ON "wishlist"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_usuario_id_producto_id_key" ON "wishlist"("usuario_id", "producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_token_token_key" ON "email_verification_token"("token");

-- CreateIndex
CREATE INDEX "email_verification_token_token_idx" ON "email_verification_token"("token");

-- CreateIndex
CREATE INDEX "email_verification_token_usuario_id_idx" ON "email_verification_token"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_token_key" ON "password_reset_token"("token");

-- CreateIndex
CREATE INDEX "password_reset_token_token_idx" ON "password_reset_token"("token");

-- CreateIndex
CREATE INDEX "password_reset_token_usuario_id_idx" ON "password_reset_token"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_key" ON "refresh_token"("token");

-- CreateIndex
CREATE INDEX "refresh_token_token_idx" ON "refresh_token"("token");

-- CreateIndex
CREATE INDEX "refresh_token_usuario_id_idx" ON "refresh_token"("usuario_id");

-- CreateIndex
CREATE INDEX "refresh_token_expira_en_idx" ON "refresh_token"("expira_en");

-- AddForeignKey
ALTER TABLE "carrito" ADD CONSTRAINT "carrito_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_carrito" ADD CONSTRAINT "fk_item_carrito_variacion" FOREIGN KEY ("variacion_id") REFERENCES "variacion_producto"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_carrito" ADD CONSTRAINT "item_carrito_carrito_id_fkey" FOREIGN KEY ("carrito_id") REFERENCES "carrito"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_carrito" ADD CONSTRAINT "item_carrito_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_pedido" ADD CONSTRAINT "fk_item_pedido_variacion" FOREIGN KEY ("variacion_id") REFERENCES "variacion_producto"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_pedido" ADD CONSTRAINT "item_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_pedido" ADD CONSTRAINT "item_pedido_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pago_simulado" ADD CONSTRAINT "pago_simulado_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_cupon_id_fkey" FOREIGN KEY ("cupon_id") REFERENCES "cupon"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_temporada_id_fkey" FOREIGN KEY ("temporada_id") REFERENCES "temporada"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "variacion_producto" ADD CONSTRAINT "variacion_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_verification_token" ADD CONSTRAINT "email_verification_token_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
