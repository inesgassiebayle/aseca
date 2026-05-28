# aseca

Appium tests:

# Solo home
NODE_OPTIONS=--experimental-vm-modules npx jest tests/home.spec.ts --runInBand

# Solo login
NODE_OPTIONS=--experimental-vm-modules npx jest tests/login.spec.ts --runInBand

# Solo register
NODE_OPTIONS=--experimental-vm-modules npx jest tests/register.spec.ts --runInBand

# Solo search
NODE_OPTIONS=--experimental-vm-modules npx jest tests/search.spec.ts --runInBand

# Solo company 
NODE_OPTIONS=--experimental-vm-modules npx jest tests/company.spec.ts --runInBand

# Todos juntos
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=tests/ --runInBand