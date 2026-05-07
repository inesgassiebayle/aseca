# F-01 — Autenticación de usuarios

## Descripción

Permite a los usuarios crear una cuenta y acceder al sistema.
El acceso está protegido por email y contraseña. No se requiere OAuth ni
autenticación de terceros en esta versión.

---

## Criterios de aceptación

- Un usuario nuevo puede registrarse con email y contraseña válidos.
- No se permite registrar dos cuentas con el mismo email.
- Un usuario registrado puede iniciar sesión con sus credenciales.
- Las credenciales incorrectas son rechazadas con error 401.
- El login exitoso retorna un token que debe incluirse en cada request posterior.
- Todo acceso a recursos protegidos requiere un token válido.

---

## User stories

- US-01 — Registro de cuenta
- US-02 — Login

---