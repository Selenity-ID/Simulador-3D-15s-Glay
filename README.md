# 🦋 Simulador 3D - 15 Años de Glaymar

<div align="center">
  <i>Una experiencia interactiva y conmemorativa desarrollada en tiempo récord, combinando arte 3D, música generativa y desarrollo web avanzado.</i>
</div>

---

## 📖 La Historia Detrás del Proyecto

Este proyecto nace de un profundo amor fraternal y la distancia. Está inspirado en mi hermana menor, **Glaymar**, con motivo de la celebración de sus 15 años. 

Llevo más de 10 años sin poder verla físicamente. Este simulador 3D no es solo un proyecto de software, es un puente construido con código y arte; una manera de hacerle saber que la acompaño en sus 15 años, así sea a través del éter, pero siempre presente con el corazón. ❤️

---

## 🚀 Sobre el Proyecto

El **Simulador 3D - 15s Glay** es un entorno virtual interactivo desarrollado desde cero para correr directamente en el navegador. Combina iluminación envolvente, sistemas de partículas avanzadas (purpurina mágica), animaciones de baile (desde el tradicional Vals hasta Hip Hop y Ballet) y un reproductor de música integrado, creando una fiesta inmersiva y deslumbrante.

Todo el desarrollo, diseño, integración y optimización fue logrado tras **una semana de arduo e incansable trabajo**, aplicando metodologías ágiles, pruebas rigurosas y las mejores prácticas de ingeniería de software.

---

## 🛠️ Stack Tecnológico y Herramientas

Para lograr que esta experiencia cobrara vida en menos de una semana, se orquestó un ecosistema completo de herramientas de última generación y modelos de Inteligencia Artificial:

### 🧠 Inteligencia Artificial y Agentes
*   **Antigravity:** Entorno avanzado de desarrollo y orquestación.
*   **Gemini Pro 3.1 & Claude Sonnet:** Agentes de IA que actuaron como *pair-programmers* para la arquitectura del código, refactorización, resolución de bugs complejos y optimización matemática de vectores en 3D.
*   **Lyria:** Generación de pistas musicales personalizadas y emotivas que ambientan perfectamente el simulador.

### 🎨 Arte 3D y Diseño Visual
*   **Meshy:** Generación y modelado de los assets 3D (el Trono de Rosas, el Pastel, el Candelabro, etc.).
*   **Mixamo:** Rigging de personajes y captura de movimiento para dotar de vida la vasta biblioteca de animaciones de baile.
*   **PhotoScape:** Edición exhaustiva, refinamiento y rediseño de las texturas (difusas, metálicas, mapas de normal y emisión) para lograr el aspecto visual realista y mágico.
*   **Wondershare Filmora:** Edición de video y producción de material audiovisual complementario de la experiencia.

### 💻 Desarrollo e Ingeniería
*   **Three.js:** Motor gráfico WebGL utilizado para renderizar el entorno, gestionar luces hemisféricas, postprocesado (UnrealBloom) y la carga asíncrona de modelos FBX.
*   **Google Apps Script & Google Drive:** Arquitectura *Serverless* ingeniosa empleada para el pipeline de assets, permitiendo bypassear límites de CORS y lograr un despliegue de la versión online estable para un entorno rico en multimedia.
*   **Vanilla JS, HTML5 & CSS3:** Construcción del núcleo de la aplicación sin depender de frameworks sobrecargados, garantizando un rendimiento óptimo tanto en PC como en dispositivos móviles.

---

## 🏆 Buenas Prácticas y Metodología

Este proyecto no solo destaca por su resultado visual, sino por la ingeniería detrás de él. Durante su construcción se implementó:
*   **Live Coding:** Desarrollo ágil con iteraciones en tiempo real y pruebas constantes.
*   **Optimización de Rendimiento (QA & Testing):** Implementación de limitadores de FPS dinámicos adaptados por hardware (detectando móviles), gestión eficiente de geometría pesada (*InstancedMesh* para el campo de rosas) y limpieza estricta de memoria para prevenir fugas (*memory leaks*).
*   **Diseño UI/UX (Pixel-Perfect):** Una interfaz de usuario inmersiva, responsiva y elegante (*glassmorphism*, animaciones de transición fluidas y controles adaptativos).
*   **Manejo de Errores Global:** Implementación de sistemas de *fallback* y monitoreo de excepciones para asegurar la resiliencia de la experiencia del usuario final.

---

## 📜 Licencia

Este proyecto tiene un valor inmensamente personal y familiar. Está licenciado bajo la **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License (CC BY-NC-ND 4.0)**. 
Puedes estudiar el código y el proyecto para aprender, pero queda **estrictamente prohibido su uso comercial o la creación de obras derivadas**. Para más detalles, consulta el archivo `LICENSE`.

<div align="center">
  <br/>
  <i>Desarrollado con pasión, café e ingeniería.</i>
</div>
