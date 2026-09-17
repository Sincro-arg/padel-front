import { Injectable, signal } from '@angular/core';

/**
 * Estado global de "¿el back responde?". Lo apaga/prende el interceptor de
 * HTTP: cualquier request que falle por falta de conexión (status 0) prende
 * el aviso; cualquier respuesta que sí llegue del back lo apaga.
 */
@Injectable({ providedIn: 'root' })
export class BackendStatusService {
  readonly isDown = signal(false);

  markDown(): void {
    this.isDown.set(true);
  }

  markUp(): void {
    this.isDown.set(false);
  }
}
