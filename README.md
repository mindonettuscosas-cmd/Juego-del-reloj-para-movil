
# Juego del Reloj con Cuerda (Versión Móvil)

Un juego arcade 2D de supervivencia donde los jugadores deben saltar una cuerda giratoria. Optimizado para pantallas táctiles y multi-touch.

## Cómo ejecutar en el móvil
1.  **Entorno Local**: Asegúrate de tener Node.js instalado.
2.  **Servidor**: Usa una herramienta como `vite` o un servidor simple de archivos estáticos. 
    *   `npx serve .` (si tienes el build listo) o usa el comando de desarrollo de tu herramienta preferida.
3.  **Red Local**: Conecta tu móvil a la misma red WiFi que tu ordenador.
4.  **Acceso**: En el navegador de tu móvil (Safari/Chrome), introduce la dirección IP local de tu ordenador (ej. `http://192.168.1.15:3000`).

## Instrucciones de Juego
- Selecciona el número de jugadores (1-8).
- Cada jugador tiene un botón de su color asignado en los bordes de la pantalla.
- Pulsa el botón para saltar cuando la cuerda se acerque a tu posición.
- La cuerda acelera y cambia de dirección aleatoriamente (con aviso visual).

## Mejoras Futuras
- **Vibración Contextual**: Usar patrones de vibración distintos para saltos exitosos vs fallidos.
- **Modo 2 Equipos**: Sumar puntos por equipo en lugar de individuales.
- **Online Local**: Usar WebRTC para que cada jugador use su propio móvil como mando mientras el juego se ve en una pantalla central (TV/PC).
- **Personalización**: Desbloquear skins para los personajes con los puntos acumulados.
- **Efectos Partículas**: Añadir efectos de polvo al caer y chispas al chocar con la cuerda.
