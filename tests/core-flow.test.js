import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeProfile, editableProfile, withTimeout } from '../src/lib/auth-utils.js';

test('editable auth metadata cannot grant an administrator role', () => {
  const user=mergeProfile({ id:'real-id', email:'real@example.test', user_metadata:{role:'admin',is_super_admin:true} },{ id:'wrong-id',email:'wrong@example.test',role:'student',is_super_admin:false });
  assert.equal(user.id,'real-id'); assert.equal(user.email,'real@example.test');
  assert.equal(user.role,'student'); assert.equal(user.is_super_admin,false);
});
test('ordinary profile editing rejects privilege and onboarding changes', () => {
  for (const key of ['role','is_super_admin','is_premium','onboarding_complete','linked_student_email']) {
    assert.throws(() => editableProfile({[key]:true}));
  }
  assert.deepEqual(editableProfile({full_name:'A Learner'}),{full_name:'A Learner'});
});
test('hung requests time out instead of leaving an indefinite loader', async () => {
  await assert.rejects(withTimeout(new Promise(() => {}),10),/timed out/);
  assert.equal(await withTimeout(Promise.resolve('ok'),10),'ok');
});
