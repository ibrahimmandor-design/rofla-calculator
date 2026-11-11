import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const html = readFileSync('management/index.html', 'utf8');
const checks = [
  ['session load deduplication state', /activeCloudUserId=null,cloudLoadPromise=null/.test(html)],
  ['same-user concurrent auth event guard', /if\(activeCloudUserId===userId\)[\s\S]{0,180}if\(cloudLoadPromise\)/.test(html)],
  ['failed initial cloud bootstrap is not reported as connected', /const saved=await persistCloudData\(\);\s*if\(!saved\)/.test(html)],
  ['cloud save returns explicit success', /cloudRevision=Number\(data\);setSyncMessage\('تم حفظ التغييرات سحابيًا — الإصدار '\+cloudRevision\);return true/.test(html)],
  ['cloud conflict blocks further saves', /ROFLA_CONFLICT[\s\S]{0,220}cloudReady=false/.test(html)],
  ['non-owner email is rejected', /toLowerCase\(\)!==ROFLA_EMAIL/.test(html)],
  ['new cloud sync build marker', /ROFLA_BUILD_20261112_CLOUD_SYNC_AUTOREFRESH_V7/.test(html)],
  ['cloud refresh tracks pending writes', /cloudWritesPending=0/.test(html) && /cloudWritesPending>0/.test(html)],
  ['automatic cloud refresh every 30 seconds', /setInterval\(\(\)=>\{if\(document\.visibilityState==='visible'\)refreshCloudIfSafe\(false\)\},30000\)/.test(html)],
  ['refreshes when app returns to foreground', /addEventListener\('focus',\(\)=>refreshCloudIfSafe\(false\)\)/.test(html)],
  ['automatic refresh protects local unsaved changes', /if\(!force&&\(cloudSaveFailed\|\|JSON\.stringify\(db\)!==lastSavedSnapshot\)\)return false/.test(html)],
  ['manual refresh warns before replacing failed local changes', /force&&\(!cloudReady\|\|cloudSaveFailed\)/.test(html)]
];
for (const [name, ok] of checks) { assert.ok(ok, 'FAIL '+name); console.log('PASS '+name); }
console.log('CLOUD SYNC GUARD RESULT: PASS ('+checks.length+' checks)');
