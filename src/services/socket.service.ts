import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

class SocketService {
  private io: SocketServer | null = null;

  inicializar(servidor: HttpServer) {
    this.io = new SocketServer(servidor, {
      cors: {
        origin: '*', // En producción deberíamos restringir esto
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`\n📱 Cliente conectado: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`\n📴 Cliente desconectado: ${socket.id}`);
      });
    });

    return this.io;
  }

  // Enviar mensaje a todos los conectados
  emitir(evento: string, datos: unknown) {
    if (!this.io) {
      console.warn('⚠️ Intentando emitir evento antes de inicializar Socket.io');
      return;
    }
    this.io.emit(evento, datos);
  }

  // Notificar una nueva orden
  notificarNuevaOrden(orden: unknown) {
    const o = orden as { ct_mesa?: { codigo: string } };
    this.emitir('orden_nueva', {
      mensaje: `Nueva orden en mesa ${o.ct_mesa?.codigo || 'N/A'}`,
      orden
    });
  }

  // Notificar cambio de estado (ej: Platillo Listo)
  notificarCambioEstado(orden: unknown) {
    const o = orden as { id_rl_orden: number; estado: string };
    this.emitir('orden_actualizada', {
      mensaje: `La orden #${o.id_rl_orden} ha cambiado a ${o.estado}`,
      orden
    });
  }
}

export default new SocketService();
