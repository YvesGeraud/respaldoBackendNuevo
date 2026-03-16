-- CreateTable
CREATE TABLE `ct_usuario` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
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
    PRIMARY KEY (`id_usuario`)
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
    `id_usuario` INTEGER NOT NULL,
    `id_mesa` INTEGER NULL,
    `estado` ENUM('PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    `total` DECIMAL(10, 2) NOT NULL,
    `fecha_registro` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `fecha_modificacion` DATETIME(6) NULL,

    INDEX `dt_orden_estado_idx`(`estado`),
    INDEX `dt_orden_id_usuario_estado_idx`(`id_usuario`, `estado`),
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
CREATE TABLE `dt_reservacion` (
    `id_reservacion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
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

-- AddForeignKey
ALTER TABLE `ct_platillo` ADD CONSTRAINT `ct_platillo_id_ct_categoria_fkey` FOREIGN KEY (`id_ct_categoria`) REFERENCES `ct_categoria`(`id_ct_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dt_orden` ADD CONSTRAINT `dt_orden_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `ct_usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dt_detalle_orden` ADD CONSTRAINT `dt_detalle_orden_id_orden_fkey` FOREIGN KEY (`id_orden`) REFERENCES `dt_orden`(`id_orden`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dt_detalle_orden` ADD CONSTRAINT `dt_detalle_orden_id_ct_platillo_fkey` FOREIGN KEY (`id_ct_platillo`) REFERENCES `ct_platillo`(`id_ct_platillo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dt_reservacion` ADD CONSTRAINT `dt_reservacion_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `ct_usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
