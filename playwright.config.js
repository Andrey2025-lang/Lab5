const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({testDir:'./test/e2e',fullyParallel:false,workers:1,reporter:'list',
 use:{baseURL:'http://localhost:3219',headless:true,trace:'retain-on-failure'},
 projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
 webServer:{command:'node test/support/e2e-server.js',url:'http://localhost:3219',reuseExistingServer:false},
});
