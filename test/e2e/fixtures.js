const {test:base,expect}=require('@playwright/test');
const test=base.extend({context:async({context},use)=>{
 await context.addCookies([{name:'test-user',value:'alice',url:'http://localhost:3219'}]);await use(context);
}});
module.exports={test,expect};
