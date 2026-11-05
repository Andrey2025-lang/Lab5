const {issueTicket,verifyTicket}=require('../../libs/tickets');
const secret='test-only-32-characters-long-secret';
test('ticket firmado conserva identidad y expira a los 60 segundos',()=>{
 const now=1700000000000;const token=issueTicket({sub:'u1',name:'Ana'},'s1',secret,now);
 expect(verifyTicket(token,secret,now)).toMatchObject({sub:'u1',name:'Ana',sid:'s1'});
 expect(()=>verifyTicket(token,secret,now+60000)).toThrow('AUTH_REQUIRED');
 expect(()=>verifyTicket(token,'wrong-secret',now)).toThrow('AUTH_REQUIRED');
});
