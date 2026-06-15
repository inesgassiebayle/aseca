# aseca

Appium tests:

# Suite 1 — register:
cd mobile && NODE_OPTIONS=--experimental-vm-modules npx jest --config jest.e2e.config.js tests/auth-register.spec.ts

# Suite 2 — login + search + company:
cd mobile && NODE_OPTIONS=--experimental-vm-modules npx jest --config jest.e2e.config.js tests/auth-login-and-search.spec.ts

# Ambas juntas:
cd mobile && NODE_OPTIONS=--experimental-vm-modules npx jest --config jest.e2e.config.js tests/auth-register.spec.ts tests/auth-login-and-search.spec.ts