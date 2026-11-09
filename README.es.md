# MenuCart

[English](README.md) | **Español**

[![CI](https://github.com/IvanJMartinezS/menucart/actions/workflows/ci.yml/badge.svg)](https://github.com/IvanJMartinezS/menucart/actions/workflows/ci.yml)
[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)

De tus menús a tu lista de compras.

## El problema

Cada quincena, planificar las comidas y escribir la lista de compras se hace a mano, y se terminan repitiendo
los mismos menús. MenuCart guarda tus menús y víveres en un solo lugar: eliges los menús de la quincena,
marcas los víveres que necesitas y la app arma la lista de compras por ti.

## Cómo funciona

1. **Guarda tus menús** una sola vez, con sus ingredientes y cantidades (por ejemplo, _Bistec con ensalada y
   maduro_: 4 bistecs, 2 maduros, 1 tomate, 1 cebolla, 1 lechuga).
2. **Elige los menús** de la quincena. Un menú se puede agregar más de una vez.
3. **Marca los víveres** que toca comprar de tu lista por defecto (víveres, charcutería…).
4. **Obtén la lista de compras**, con los ingredientes iguales sumados y agrupados por categoría: carnes,
   verduras, víveres y charcutería.

## Estado del proyecto

🚧 **En desarrollo.** El proyecto se construye paso a paso, con pull requests pequeños.

- [ ] **v0.1** — Menús, víveres, planificación de la quincena y lista de compras combinada. Español e inglés.
- [ ] **v1** — Cuenta compartida del hogar, marcar productos durante la compra, compartir la lista por
      WhatsApp, fotos de los menús, historial para no repetir menús, app instalable (PWA) y demo pública.
- [ ] **v2** — Sincronización en tiempo real entre celulares, importar recetas con IA y recordatorios por
      Telegram.

## Tecnologías

| Capa          | Tecnología                                      | Por qué                                                            |
| ------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| Frontend      | React, Vite, TypeScript, Tailwind CSS           | Desarrollo rápido y una interfaz tipada basada en componentes      |
| App           | PWA (`vite-plugin-pwa`)                         | Se instala en el celular con un solo código, sin tiendas de apps   |
| Datos         | TanStack Query, React Hook Form                 | Caché del estado del servidor y formularios con validación         |
| i18n          | i18next                                         | Español e inglés desde el primer día                               |
| API           | Hono en Cloudflare Workers                      | API ligera, basada en estándares y ejecutada en el edge            |
| Base de datos | PostgreSQL con Drizzle ORM                      | Datos relacionales con consultas tipadas y migraciones versionadas |
| Validación    | Zod (paquete compartido)                        | Los mismos esquemas validan los datos en el frontend y en la API   |
| Calidad       | Vitest, oxlint, Prettier, TypeScript (estricto) | Tests y linting rápidos, formato consistente                       |
| CI            | GitHub Actions                                  | Lint, typecheck, tests y build en cada pull request                |

## Estructura del repositorio

Es un monorepo con pnpm:

```text
menucart/
├── apps/
│   ├── web/        # PWA en React
│   └── api/        # API con Hono en Cloudflare Workers
└── packages/
    └── shared/     # Esquemas Zod, tipos y lógica de dominio compartidos por web y api
```

## Cómo ejecutarlo

**Requisitos:** Node.js 22 o superior (se recomienda 24, ver `.nvmrc`), pnpm 11 y Docker (para la base de
datos local).

```bash
pnpm install    # instalar dependencias
pnpm dev        # iniciar la web y la API
```

| Comando          | Descripción                         |
| ---------------- | ----------------------------------- |
| `pnpm dev`       | Inicia la web y la API              |
| `pnpm build`     | Compila todos los paquetes          |
| `pnpm test`      | Ejecuta los tests                   |
| `pnpm lint`      | Revisa el código con oxlint         |
| `pnpm typecheck` | Comprueba los tipos de cada paquete |
| `pnpm format`    | Formatea el código con Prettier     |
| `pnpm db:up`     | Inicia la base de datos local       |
| `pnpm db:down`   | Detiene la base de datos local      |

### Base de datos local

En desarrollo se usa PostgreSQL en Docker, definido en [`docker-compose.yml`](docker-compose.yml). Los datos
se conservan en un volumen de Docker entre reinicios.

```bash
pnpm db:up                                          # inicia Postgres en localhost:5432
cp apps/api/.dev.vars.example apps/api/.dev.vars    # cadena de conexión para la API
```

## Flujo de trabajo

- **GitHub Flow:** `main` siempre está lista para desplegar y está protegida; cada cambio pasa por una rama
  corta (`feat/…`, `fix/…`, `docs/…`, `ci/…`, `chore/…`) y un pull request.
- **Conventional Commits:** commits pequeños y concretos, como `feat(api): add menu creation endpoint`.
- **Los pull requests** deben pasar la CI y se fusionan con rebase para mantener un historial lineal.

## Licencia

[MIT](LICENSE) © 2026 Ivan Martinez
