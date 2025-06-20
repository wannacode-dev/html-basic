const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const print = {
    step: (msg) => console.log(`${colors.blue}==>${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}!${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.blue}=== ${msg} ===${colors.reset}\n`)
};

function checkCommand(command) {
    try {
        execSync(process.platform === 'win32' ? 
            `where ${command}` : 
            `which ${command}`, 
            { stdio: 'ignore' }
        );
        return true;
    } catch {
        return false;
    }
}

function execCommand(command, errorMessage) {
    try {
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        print.error(errorMessage);
        print.error(`Команда завершилась с ошибкой: ${error.message}`);
        return false;
    }
}

async function setup() {
    print.header('WannaCode Course Setup');

    print.step('Проверка необходимых зависимостей...');
    const requiredCommands = ['git', 'node', 'npm'];
    for (const cmd of requiredCommands) {
        if (!checkCommand(cmd)) {
            print.error(`${cmd} не установлен!`);
            console.log(`Пожалуйста, установите ${cmd} и попробуйте снова`);
            process.exit(1);
        }
    }
    print.success('Все необходимые зависимости установлены');

    print.header('Версии установленных компонентов');
    console.log(`Node.js: ${process.version}`);
    console.log(`npm: ${execSync('npm --version').toString().trim()}`);
    console.log(`Git: ${execSync('git --version').toString().trim()}\n`);

    print.step('Проверка состояния local-ui...');
    const localUiPath = path.join(process.cwd(), 'local-ui');
    if (fs.existsSync(localUiPath)) {
        print.warning('Найдена существующая папка local-ui');
        print.step('Очистка local-ui...');
        fs.rmSync(localUiPath, { recursive: true, force: true });
        print.success('Папка local-ui очищена');
    }

    print.step('Инициализация и обновление сабмодуля local-ui...');
    if (!execCommand('git submodule add https://github.com/wannacode-dev/local-ui 2>nul || git submodule update --init --recursive',
        'Ошибка при инициализации сабмодуля')) {
        process.exit(1);
    }
    print.success('Сабмодуль успешно инициализирован');

    print.step('Установка зависимостей local-ui...');
    process.chdir('local-ui');
    if (!execCommand('npm install', 'Ошибка при установке зависимостей local-ui')) {
        process.exit(1);
    }
    print.success('Зависимости local-ui успешно установлены');

    print.step('Сборка local-ui...');
    if (!execCommand('npm run build', 'Ошибка при сборке local-ui')) {
        process.exit(1);
    }
    print.success('local-ui успешно собран');
    process.chdir('..');

    print.step('Установка корневых зависимостей проекта...');
    if (!execCommand('npm install', 'Ошибка при установке корневых зависимостей')) {
        process.exit(1);
    }
    print.success('Корневые зависимости успешно установлены');

    print.header('Установка успешно завершена!');
    console.log('\nДля запуска проекта выполните:');
    console.log(`${colors.blue}npm start${colors.reset}\n`);
}

setup().catch(error => {
    print.error('Произошла непредвиденная ошибка:');
    console.error(error);
    process.exit(1); 
});