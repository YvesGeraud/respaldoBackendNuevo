-- CreateTable
CREATE TABLE `ct_usuario` (
    `id_ct_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario` VARCHAR(100) NOT NULL,
    `contrasena` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `nombre_completo` VARCHAR(200) NOT NULL,
    `rol` ENUM('ADMIN', 'CAJERO', 'COCINERO') NOT NULL DEFAULT 'CAJERO',
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `fecha_registro` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `fecha_modificacion` DATETIME(6) NULL,

    UNIQUE INDEX `ct_usuario_usuario_key`(`usuario`),
    UNIQUE INDEX `ct_usuario_email_key`(`email`),
    INDEX `ct_usuario_estado_idx`(`estado`),
    PRIMARY KEY (`id_ct_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ct_categoria` (
    `id_ct_categoria` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(500) NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `fecha_registro` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `fecha_modificacion` DATETIME(6) NULL,

    UNIQUE INDEX `ct_categoria_nombre_key`(`nombre`),
    INDEX `ct_categoria_estado_idx`(`estado`),
    PRIMARY KEY (`id_ct_categoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ct_platillo` (
    `id_ct_platillo` INTEGER NOT NULL AUTO_INCREMENT,
    `id_ct_categoria` INTEGER NOT NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `descripcion` VARCHAR(500) NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `imagen_url` VARCHAR(500) NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `fecha_registro` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `fecha_modificacion` DATETIME(6) NULL,

    INDEX `ct_platillo_estado_idx`(`estado`),
    INDEX `ct_platillo_id_ct_categoria_estado_idx`(`id_ct_categoria`, `estado`),
    PRIMARY KEY (`id_ct_platillo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dt_orden` (
    `id_orden` INTEGER NOT NULL AUTO_INCREMENT,
    `id_ct_usuario` INTEGER NOT NULL,
    `id_mesa` INTEGER NULL,
    `estado` ENUM('PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    `total` DECIMAL(10, 2) NOT NULL,
    `fecha_registro` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `fecha_modificacion` DATETIME(6) NULL,

    INDEX `dt_orden_estado_idx`(`estado`),
    INDEX `dt_orden_id_ct_usuario_estado_idx`(`id_ct_usuario`, `estado`),
    INDEX `dt_orden_id_mesa_estado_idx`(`id_mesa`, `estado`),
    PRIMARY KEY (`id_orden`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dt_detalle_orden` (
    `id_detalle` INTEGER NOT NULL AUTO_INCREMENT,
    `id_orden` INTEGER NOT NULL,
    `id_ct_platillo` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id_detalle`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dt_refresh_token` (
    `id_dt_refresh_token` INTEGER NOT NULL AUTO_INCREMENT,
    `token_hash` VARCHAR(64) NOT NULL,
    `id_ct_usuario` INTEGER NOT NULL,
    `expira_en` DATETIME(6) NOT NULL,
    `revocado` BOOLEAN NOT NULL DEFAULT false,
    `revocado_en` DATETIME(0) NULL,
    `reemplazado_por` INTEGER NULL,
    `creado_en` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `token_hash`(`token_hash`),
    INDEX `dt_refresh_token_id_ct_usuario_idx`(`id_ct_usuario`),
    INDEX `dt_refresh_token_expira_en_idx`(`expira_en`),
    INDEX `dt_refresh_token_revocado_expira_en_idx`(`revocado`, `expira_en`),
    PRIMARY KEY (`id_dt_refresh_token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dt_reservacion` (
    `id_reservacion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_ct_usuario` INTEGER NOT NULL,
    `nombre_cliente` VARCHAR(200) NOT NULL,
    `fecha` DATETIME(6) NOT NULL,
    `num_personas` INTEGER NOT NULL,
    `estado` ENUM('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA') NOT NULL DEFAULT 'PENDIENTE',
    `notas` VARCHAR(500) NULL,
    `fecha_registro` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `fecha_modificacion` DATETIME(6) NULL,

    INDEX `dt_reservacion_estado_idx`(`estado`),
    INDEX `dt_reservacion_fecha_estado_idx`(`fecha`, `estado`),
    PRIMARY KEY (`id_reservacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `statusCode` INTEGER NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `payload` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ct_tipo_documento` (
    `id_ct_tipo_documento` INTEGER NOT NULL AUTO_INCREMENT,
    `clave` VARCHAR(50) NOT NULL DEFAULT '',
    `descripcion` VARCHAR(255) NOT NULL DEFAULT '',
    `max_size_bytes` INTEGER NOT NULL,
    `extensiones_permitidas` VARCHAR(255) NOT NULL DEFAULT 'pdf,jpg,png',
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `fecha_in` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fecha_up` DATETIME(0) NULL,
    `id_ct_usuario_in` INTEGER NOT NULL,
    `id_ct_usuario_up` INTEGER NULL,

    UNIQUE INDEX `clave`(`clave`),
    INDEX `ct_usuario_in`(`id_ct_usuario_in`),
    INDEX `ct_usuario_up`(`id_ct_usuario_up`),
    INDEX `estado`(`estado`),
    PRIMARY KEY (`id_ct_tipo_documento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dt_documento` (
    `id_dt_documento` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_original` VARCHAR(255) NOT NULL,
    `nombre_sistema` VARCHAR(255) NOT NULL,
    `ruta_relativa` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `tamaño_bytes` INTEGER NOT NULL,
    `hash` VARCHAR(64) NOT NULL,
    `id_ct_tipo_documento` INTEGER NOT NULL,
    `modulo` VARCHAR(100) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `fecha_in` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fecha_up` DATETIME(0) NULL,
    `id_ct_usuario_in` INTEGER NOT NULL,
    `id_ct_usuario_up` INTEGER NULL,

    INDEX `idx_hash`(`hash`),
    INDEX `estado`(`estado`),
    INDEX `idx_id_ct_tipo_documento`(`id_ct_tipo_documento`),
    INDEX `id_ct_usuario_in`(`id_ct_usuario_in`),
    INDEX `id_ct_usuario_up`(`id_ct_usuario_up`),
    PRIMARY KEY (`id_dt_documento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ct_platillo` ADD CONSTRAINT `ct_platillo_id_ct_categoria_fkey` FOREIGN KEY (`id_ct_categoria`) REFERENCES `ct_categoria`(`id_ct_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dt_orden` ADD CONSTRAINT `dt_orden_id_ct_usuario_fkey` FOREIGN KEY (`id_ct_usuario`) REFERENCES `ct_usuario`(`id_ct_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dt_detalle_orden` ADD CONSTRAINT `dt_detalle_orden_id_orden_fkey` FOREIGN KEY (`id_orden`) REFERENCES `dt_orden`(`id_orden`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dt_detalle_orden` ADD CONSTRAINT `dt_detalle_orden_id_ct_platillo_fkey` FOREIGN KEY (`id_ct_platillo`) REFERENCES `ct_platillo`(`id_ct_platillo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dt_refresh_token` ADD CONSTRAINT `dt_refresh_token_id_ct_usuario_fkey` FOREIGN KEY (`id_ct_usuario`) REFERENCES `ct_usuario`(`id_ct_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dt_reservacion` ADD CONSTRAINT `dt_reservacion_id_ct_usuario_fkey` FOREIGN KEY (`id_ct_usuario`) REFERENCES `ct_usuario`(`id_ct_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dt_documento` ADD CONSTRAINT `fk_dt_documento_tipo` FOREIGN KEY (`id_ct_tipo_documento`) REFERENCES `ct_tipo_documento`(`id_ct_tipo_documento`) ON DELETE RESTRICT ON UPDATE CASCADE;
