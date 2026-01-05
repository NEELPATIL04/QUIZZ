module.exports = {
    apps: [
        {
            name: 'quizz-backend',
            cwd: './backend',
            script: 'npm',
            args: 'run start',
            env: {
                NODE_ENV: 'production',
                PORT: 5000
            }
        },
        {
            name: 'quizz-frontend',
            cwd: './frontend',
            script: 'npm',
            args: 'run start',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            }
        }
    ]
};
