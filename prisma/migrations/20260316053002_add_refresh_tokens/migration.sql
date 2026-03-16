-- CreateIndex
CREATE INDEX `dt_refresh_token_id_ct_usuario_idx` ON `dt_refresh_token`(`id_ct_usuario`);

-- CreateIndex
CREATE INDEX `dt_refresh_token_expira_en_idx` ON `dt_refresh_token`(`expira_en`);

-- CreateIndex
CREATE INDEX `dt_refresh_token_revocado_expira_en_idx` ON `dt_refresh_token`(`revocado`, `expira_en`);

-- AddForeignKey
ALTER TABLE `dt_refresh_token` ADD CONSTRAINT `dt_refresh_token_id_ct_usuario_fkey` FOREIGN KEY (`id_ct_usuario`) REFERENCES `ct_usuario`(`id_ct_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;
