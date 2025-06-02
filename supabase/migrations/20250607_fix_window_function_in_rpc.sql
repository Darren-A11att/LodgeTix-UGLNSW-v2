-- Fix window function error in get_event_with_details RPC function
-- Date: 2025-06-07
-- Description: Fixes "aggregate function calls cannot contain window function calls" error

DROP FUNCTION IF EXISTS get_event_with_details(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION get_event_with_details(p_event_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_function_id UUID;
    v_result JSON;
BEGIN
    -- Get event and function IDs
    SELECT e.event_id, e.function_id 
    INTO v_event_id, v_function_id
    FROM events e
    WHERE e.slug = p_event_slug
      AND e.is_published = true;vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:4877 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
featured-events-section.tsx:78  Server  Failed to load featured events: TypeError: Cannot read properties of undefined (reading 'event')
    at eval (featured-events-section.tsx:19:23)
    at FeaturedEventsSection (featured-events-section.tsx:18:37)
    at resolveErrorDev (react-server-dom-webpack-client.browser.development.js:1845:46)
    at getOutlinedModel (react-server-dom-webpack-client.browser.development.js:1329:22)
    at parseModelString (react-server-dom-webpack-client.browser.development.js:1469:15)
    at Array.eval (react-server-dom-webpack-client.browser.development.js:2274:18)
    at JSON.parse (<anonymous>)
    at resolveConsoleEntry (react-server-dom-webpack-client.browser.development.js:2109:28)
    at processFullStringRow (react-server-dom-webpack-client.browser.development.js:2250:11)
    at processFullBinaryRow (react-server-dom-webpack-client.browser.development.js:2213:7)
    at progress (react-server-dom-webpack-client.browser.development.js:2459:17)
error @ intercept-console-error.js:50
eval @ console.js:44
FeaturedEventsSection @ featured-events-section.tsx:78
react-stack-bottom-frame @ react-server-dom-webpack-client.browser.development.js:2648
resolveConsoleEntry @ react-server-dom-webpack-client.browser.development.js:2115
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2250
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
<FeaturedEventsSection>
HomePage @ page.tsx:54
buildFakeTask @ react-server-dom-webpack-client.browser.development.js:2021
initializeFakeTask @ react-server-dom-webpack-client.browser.development.js:2007
resolveDebugInfo @ react-server-dom-webpack-client.browser.development.js:2043
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2241
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
<HomePage>
buildFakeTask @ react-server-dom-webpack-client.browser.development.js:2020
initializeFakeTask @ react-server-dom-webpack-client.browser.development.js:2007
resolveDebugInfo @ react-server-dom-webpack-client.browser.development.js:2043
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2241
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
"use server"
ResponseInstance @ react-server-dom-webpack-client.browser.development.js:1567
createResponseFromOptions @ react-server-dom-webpack-client.browser.development.js:2376
exports.createFromReadableStream @ react-server-dom-webpack-client.browser.development.js:2696
eval @ app-index.js:133
(app-pages-browser)/./node_modules/next/dist/client/app-index.js @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:2635
options.factory @ webpack.js?v=1748786439156:712
__webpack_require__ @ webpack.js?v=1748786439156:37
fn @ webpack.js?v=1748786439156:369
eval @ app-next-dev.js:10
eval @ app-bootstrap.js:62
loadScriptsInSequence @ app-bootstrap.js:23
appBootstrap @ app-bootstrap.js:56
eval @ app-next-dev.js:9
(app-pages-browser)/./node_modules/next/dist/client/app-next-dev.js @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:2657
options.factory @ webpack.js?v=1748786439156:712
__webpack_require__ @ webpack.js?v=1748786439156:37
__webpack_exec__ @ main-app.js?v=1748786439156:34
(anonymous) @ main-app.js?v=1748786439156:35
__webpack_require__.O @ webpack.js?v=1748786439156:84
webpackJsonpCallback @ webpack.js?v=1748786439156:1398
(anonymous) @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:9
event-timeline.tsx:57  Server  Each child in a list should have a unique "key" prop. See https://react.dev/link/warning-keys for more information.
error @ intercept-console-error.js:50
eval @ console.js:44
react-stack-bottom-frame @ react-server-dom-webpack-client.browser.development.js:2648
resolveConsoleEntry @ react-server-dom-webpack-client.browser.development.js:2115
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2250
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
<TimelineEventCard>
eval @ event-timeline.tsx:57
EventTimeline @ event-timeline.tsx:56
buildFakeTask @ react-server-dom-webpack-client.browser.development.js:2021
initializeFakeTask @ react-server-dom-webpack-client.browser.development.js:2007
resolveDebugInfo @ react-server-dom-webpack-client.browser.development.js:2043
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2241
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
<EventTimeline>
EventTimelineWithData @ event-timeline.tsx:80
buildFakeTask @ react-server-dom-webpack-client.browser.development.js:2021
initializeFakeTask @ react-server-dom-webpack-client.browser.development.js:2007
resolveDebugInfo @ react-server-dom-webpack-client.browser.development.js:2043
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2241
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
<EventTimelineWithData>
HomePage @ page.tsx:51
buildFakeTask @ react-server-dom-webpack-client.browser.development.js:2021
initializeFakeTask @ react-server-dom-webpack-client.browser.development.js:2007
resolveDebugInfo @ react-server-dom-webpack-client.browser.development.js:2043
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2241
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
<HomePage>
buildFakeTask @ react-server-dom-webpack-client.browser.development.js:2020
initializeFakeTask @ react-server-dom-webpack-client.browser.development.js:2007
resolveDebugInfo @ react-server-dom-webpack-client.browser.development.js:2043
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2241
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
"use server"
ResponseInstance @ react-server-dom-webpack-client.browser.development.js:1567
createResponseFromOptions @ react-server-dom-webpack-client.browser.development.js:2376
exports.createFromReadableStream @ react-server-dom-webpack-client.browser.development.js:2696
eval @ app-index.js:133
(app-pages-browser)/./node_modules/next/dist/client/app-index.js @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:2635
options.factory @ webpack.js?v=1748786439156:712
__webpack_require__ @ webpack.js?v=1748786439156:37
fn @ webpack.js?v=1748786439156:369
eval @ app-next-dev.js:10
eval @ app-bootstrap.js:62
loadScriptsInSequence @ app-bootstrap.js:23
appBootstrap @ app-bootstrap.js:56
eval @ app-next-dev.js:9
(app-pages-browser)/./node_modules/next/dist/client/app-next-dev.js @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:2657
options.factory @ webpack.js?v=1748786439156:712
__webpack_require__ @ webpack.js?v=1748786439156:37
__webpack_exec__ @ main-app.js?v=1748786439156:34
(anonymous) @ main-app.js?v=1748786439156:35
__webpack_require__.O @ webpack.js?v=1748786439156:84
webpackJsonpCallback @ webpack.js?v=1748786439156:1398
(anonymous) @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:9
locationStore.ts:175 [LocationStore] Fetching IP data from ipapi.co...
error-boundary-callbacks.js:83 Uncaught TypeError: Cannot read properties of undefined (reading 'event')
    at eval (featured-events-section.tsx:132:31)
    at FeaturedEventsFallback (featured-events-section.tsx:129:26)
    at resolveErrorDev (react-server-dom-webpack-client.browser.development.js:1845:46)
    at processFullStringRow (react-server-dom-webpack-client.browser.development.js:2225:17)
    at processFullBinaryRow (react-server-dom-webpack-client.browser.development.js:2213:7)
    at progress (react-server-dom-webpack-client.browser.development.js:2459:17)
getReactStitchedError @ stitched-error.js:26
onUncaughtError @ error-boundary-callbacks.js:75
onCaughtError @ error-boundary-callbacks.js:41
logCaughtError @ react-dom-client.development.js:7794
runWithFiberInDEV @ react-dom-client.development.js:1511
inst.componentDidCatch.update.callback @ react-dom-client.development.js:7841
callCallback @ react-dom-client.development.js:4589
commitCallbacks @ react-dom-client.development.js:4609
runWithFiberInDEV @ react-dom-client.development.js:1511
commitClassCallbacks @ react-dom-client.development.js:10677
commitLayoutEffectOnFiber @ react-dom-client.development.js:11284
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11212
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11289
flushLayoutEffects @ react-dom-client.development.js:15547
commitRoot @ react-dom-client.development.js:15390
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<div>
HomePage @ page.tsx:17
eval @ react-server-dom-webpack-client.browser.development.js:2335
initializeModelChunk @ react-server-dom-webpack-client.browser.development.js:1034
readChunk @ react-server-dom-webpack-client.browser.development.js:929
react-stack-bottom-frame @ react-dom-client.development.js:24059
createChild @ react-dom-client.development.js:6872
reconcileChildrenArray @ react-dom-client.development.js:7179
reconcileChildFibersImpl @ react-dom-client.development.js:7502
eval @ react-dom-client.development.js:7607
reconcileChildren @ react-dom-client.development.js:8048
beginWork @ react-dom-client.development.js:10293
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopSync @ react-dom-client.development.js:14944
renderRootSync @ react-dom-client.development.js:14924
performWorkOnRoot @ react-dom-client.development.js:14411
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<HomePage>
buildFakeTask @ react-server-dom-webpack-client.browser.development.js:2020
initializeFakeTask @ react-server-dom-webpack-client.browser.development.js:2007
resolveDebugInfo @ react-server-dom-webpack-client.browser.development.js:2043
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2241
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
"use server"
ResponseInstance @ react-server-dom-webpack-client.browser.development.js:1567
createResponseFromOptions @ react-server-dom-webpack-client.browser.development.js:2376
exports.createFromReadableStream @ react-server-dom-webpack-client.browser.development.js:2696
eval @ app-index.js:133
(app-pages-browser)/./node_modules/next/dist/client/app-index.js @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:2635
options.factory @ webpack.js?v=1748786439156:712
__webpack_require__ @ webpack.js?v=1748786439156:37
fn @ webpack.js?v=1748786439156:369
eval @ app-next-dev.js:10
eval @ app-bootstrap.js:62
loadScriptsInSequence @ app-bootstrap.js:23
appBootstrap @ app-bootstrap.js:56
eval @ app-next-dev.js:9
(app-pages-browser)/./node_modules/next/dist/client/app-next-dev.js @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:2657
options.factory @ webpack.js?v=1748786439156:712
__webpack_require__ @ webpack.js?v=1748786439156:37
__webpack_exec__ @ main-app.js?v=1748786439156:34
(anonymous) @ main-app.js?v=1748786439156:35
__webpack_require__.O @ webpack.js?v=1748786439156:84
webpackJsonpCallback @ webpack.js?v=1748786439156:1398
(anonymous) @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:9
global-error.tsx:15 Global error caught: TypeError: Cannot read properties of undefined (reading 'event')
    at eval (featured-events-section.tsx:132:31)
    at FeaturedEventsFallback (featured-events-section.tsx:129:26)
    at resolveErrorDev (react-server-dom-webpack-client.browser.development.js:1845:46)
    at processFullStringRow (react-server-dom-webpack-client.browser.development.js:2225:17)
    at processFullBinaryRow (react-server-dom-webpack-client.browser.development.js:2213:7)
    at progress (react-server-dom-webpack-client.browser.development.js:2459:17)
error @ intercept-console-error.js:50
eval @ console.js:44
GlobalError.useEffect @ global-error.tsx:15
react-stack-bottom-frame @ react-dom-client.development.js:24036
runWithFiberInDEV @ react-dom-client.development.js:1511
commitHookEffectListMount @ react-dom-client.development.js:10515
commitHookPassiveMountEffects @ react-dom-client.development.js:10636
commitPassiveMountOnFiber @ react-dom-client.development.js:12442
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12445
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12435
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12558
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:12416
commitPassiveMountOnFiber @ react-dom-client.development.js:12454
flushPassiveEffects @ react-dom-client.development.js:15796
flushPendingEffects @ react-dom-client.development.js:15761
flushSpawnedWork @ react-dom-client.development.js:15656
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<GlobalError>
exports.jsx @ react-jsx-runtime.development.js:319
ErroredHtml @ app-dev-overlay-error-boundary.js:29
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopSync @ react-dom-client.development.js:14944
renderRootSync @ react-dom-client.development.js:14924
performWorkOnRoot @ react-dom-client.development.js:14454
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<ErroredHtml>
exports.jsx @ react-jsx-runtime.development.js:319
render @ app-dev-overlay-error-boundary.js:56
react-stack-bottom-frame @ react-dom-client.development.js:23963
updateClassComponent @ react-dom-client.development.js:8885
beginWork @ react-dom-client.development.js:9959
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopSync @ react-dom-client.development.js:14944
renderRootSync @ react-dom-client.development.js:14924
performWorkOnRoot @ react-dom-client.development.js:14454
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<AppDevOverlayErrorBoundary>
exports.jsxs @ react-jsx-runtime.development.js:331
AppDevOverlay @ app-dev-overlay.js:72
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopConcurrentByScheduler @ react-dom-client.development.js:15114
renderRootConcurrent @ react-dom-client.development.js:15089
performWorkOnRoot @ react-dom-client.development.js:14410
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<AppDevOverlay>
exports.jsx @ react-jsx-runtime.development.js:319
HotReload @ hot-reloader-client.js:542
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopConcurrentByScheduler @ react-dom-client.development.js:15114
renderRootConcurrent @ react-dom-client.development.js:15089
performWorkOnRoot @ react-dom-client.development.js:14410
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<HotReload>
exports.jsx @ react-jsx-runtime.development.js:319
Router @ app-router.js:543
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopConcurrentByScheduler @ react-dom-client.development.js:15114
renderRootConcurrent @ react-dom-client.development.js:15089
performWorkOnRoot @ react-dom-client.development.js:14410
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<Router>
exports.jsx @ react-jsx-runtime.development.js:319
AppRouter @ app-router.js:591
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopConcurrentByScheduler @ react-dom-client.development.js:15114
renderRootConcurrent @ react-dom-client.development.js:15089
performWorkOnRoot @ react-dom-client.development.js:14410
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<AppRouter>
exports.jsx @ react-jsx-runtime.development.js:319
ServerRoot @ app-index.js:160
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
replayFunctionComponent @ react-dom-client.development.js:8362
replayBeginWork @ react-dom-client.development.js:15152
runWithFiberInDEV @ react-dom-client.development.js:1511
replaySuspendedUnitOfWork @ react-dom-client.development.js:15141
renderRootConcurrent @ react-dom-client.development.js:15021
performWorkOnRoot @ react-dom-client.development.js:14410
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<ServerRoot>
exports.jsx @ react-jsx-runtime.development.js:319
hydrate @ app-index.js:196
eval @ app-next-dev.js:11
eval @ app-bootstrap.js:62
loadScriptsInSequence @ app-bootstrap.js:23
appBootstrap @ app-bootstrap.js:56
eval @ app-next-dev.js:9
(app-pages-browser)/./node_modules/next/dist/client/app-next-dev.js @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:2657
options.factory @ webpack.js?v=1748786439156:712
__webpack_require__ @ webpack.js?v=1748786439156:37
__webpack_exec__ @ main-app.js?v=1748786439156:34
(anonymous) @ main-app.js?v=1748786439156:35
__webpack_require__.O @ webpack.js?v=1748786439156:84
webpackJsonpCallback @ webpack.js?v=1748786439156:1398
(anonymous) @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:9
global-error.tsx:15 Global error caught: TypeError: Cannot read properties of undefined (reading 'event')
    at eval (featured-events-section.tsx:132:31)
    at FeaturedEventsFallback (featured-events-section.tsx:129:26)
    at resolveErrorDev (react-server-dom-webpack-client.browser.development.js:1845:46)
    at processFullStringRow (react-server-dom-webpack-client.browser.development.js:2225:17)
    at processFullBinaryRow (react-server-dom-webpack-client.browser.development.js:2213:7)
    at progress (react-server-dom-webpack-client.browser.development.js:2459:17)
error @ intercept-console-error.js:50
eval @ console.js:44
GlobalError.useEffect @ global-error.tsx:15
react-stack-bottom-frame @ react-dom-client.development.js:24036
runWithFiberInDEV @ react-dom-client.development.js:1511
commitHookEffectListMount @ react-dom-client.development.js:10515
commitHookPassiveMountEffects @ react-dom-client.development.js:10636
reconnectPassiveEffects @ react-dom-client.development.js:12605
recursivelyTraverseReconnectPassiveEffects @ react-dom-client.development.js:12577
reconnectPassiveEffects @ react-dom-client.development.js:12652
recursivelyTraverseReconnectPassiveEffects @ react-dom-client.development.js:12577
reconnectPassiveEffects @ react-dom-client.development.js:12598
recursivelyTraverseReconnectPassiveEffects @ react-dom-client.development.js:12577
reconnectPassiveEffects @ react-dom-client.development.js:12598
doubleInvokeEffectsOnFiber @ react-dom-client.development.js:16027
runWithFiberInDEV @ react-dom-client.development.js:1511
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15987
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15994
commitDoubleInvokeEffectsInDEV @ react-dom-client.development.js:16036
flushPassiveEffects @ react-dom-client.development.js:15806
flushPendingEffects @ react-dom-client.development.js:15761
flushSpawnedWork @ react-dom-client.development.js:15656
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<GlobalError>
exports.jsx @ react-jsx-runtime.development.js:319
ErroredHtml @ app-dev-overlay-error-boundary.js:29
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopSync @ react-dom-client.development.js:14944
renderRootSync @ react-dom-client.development.js:14924
performWorkOnRoot @ react-dom-client.development.js:14454
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<ErroredHtml>
exports.jsx @ react-jsx-runtime.development.js:319
render @ app-dev-overlay-error-boundary.js:56
react-stack-bottom-frame @ react-dom-client.development.js:23963
updateClassComponent @ react-dom-client.development.js:8885
beginWork @ react-dom-client.development.js:9959
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopSync @ react-dom-client.development.js:14944
renderRootSync @ react-dom-client.development.js:14924
performWorkOnRoot @ react-dom-client.development.js:14454
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<AppDevOverlayErrorBoundary>
exports.jsxs @ react-jsx-runtime.development.js:331
AppDevOverlay @ app-dev-overlay.js:72
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopConcurrentByScheduler @ react-dom-client.development.js:15114
renderRootConcurrent @ react-dom-client.development.js:15089
performWorkOnRoot @ react-dom-client.development.js:14410
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<AppDevOverlay>
exports.jsx @ react-jsx-runtime.development.js:319
HotReload @ hot-reloader-client.js:542
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopConcurrentByScheduler @ react-dom-client.development.js:15114
renderRootConcurrent @ react-dom-client.development.js:15089
performWorkOnRoot @ react-dom-client.development.js:14410
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<HotReload>
exports.jsx @ react-jsx-runtime.development.js:319
Router @ app-router.js:543
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopConcurrentByScheduler @ react-dom-client.development.js:15114
renderRootConcurrent @ react-dom-client.development.js:15089
performWorkOnRoot @ react-dom-client.development.js:14410
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<Router>
exports.jsx @ react-jsx-runtime.development.js:319
AppRouter @ app-router.js:591
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
renderWithHooks @ react-dom-client.development.js:5091
updateFunctionComponent @ react-dom-client.development.js:8328
beginWork @ react-dom-client.development.js:9945
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopConcurrentByScheduler @ react-dom-client.development.js:15114
renderRootConcurrent @ react-dom-client.development.js:15089
performWorkOnRoot @ react-dom-client.development.js:14410
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<AppRouter>
exports.jsx @ react-jsx-runtime.development.js:319
ServerRoot @ app-index.js:160
react-stack-bottom-frame @ react-dom-client.development.js:23950
renderWithHooksAgain @ react-dom-client.development.js:5179
replayFunctionComponent @ react-dom-client.development.js:8362
replayBeginWork @ react-dom-client.development.js:15152
runWithFiberInDEV @ react-dom-client.development.js:1511
replaySuspendedUnitOfWork @ react-dom-client.development.js:15141
renderRootConcurrent @ react-dom-client.development.js:15021
performWorkOnRoot @ react-dom-client.development.js:14410
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<ServerRoot>
exports.jsx @ react-jsx-runtime.development.js:319
hydrate @ app-index.js:196
eval @ app-next-dev.js:11
eval @ app-bootstrap.js:62
loadScriptsInSequence @ app-bootstrap.js:23
appBootstrap @ app-bootstrap.js:56
eval @ app-next-dev.js:9
(app-pages-browser)/./node_modules/next/dist/client/app-next-dev.js @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:2657
options.factory @ webpack.js?v=1748786439156:712
__webpack_require__ @ webpack.js?v=1748786439156:37
__webpack_exec__ @ main-app.js?v=1748786439156:34
(anonymous) @ main-app.js?v=1748786439156:35
__webpack_require__.O @ webpack.js?v=1748786439156:84
webpackJsonpCallback @ webpack.js?v=1748786439156:1398
(anonymous) @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:9
locationStore.ts:190 [LocationStore] Received IP data: {ip: '2401:d002:8e05:5400:b532:d2e5:1f90:945e', network: '2401:d002:8e00::/40', version: 'IPv6', city: 'Sydney', region: 'New South Wales', …}
locationStore.ts:201 [LocationStore] Mapped IP data: {ip: '2401:d002:8e05:5400:b532:d2e5:1f90:945e', version: 'IPv6', city: 'Sydney', region: 'New South Wales', region_code: 'NSW', …}
locationStore.ts:209 [LocationStore] Setting final IP data state: {ip: '2401:d002:8e05:5400:b532:d2e5:1f90:945e', version: 'IPv6', city: 'Sydney', region: 'New South Wales', region_code: 'NSW', …}
locationStore.ts:216 [LocationStore] Triggering preloads for country: Australia (Code: AU), region: NSW
locationStore.ts:324 [LocationStore] GLs for country Australia already cached and fresh.
locationStore.ts:362 [LocationStore] GLs for region NSW already cached and fresh.
locationStore.ts:397 [LocationStore] Lodges for region NSW already cached and fresh (byRegion).
page.tsx:17 
            
            
           POST https://o4509321609019392.ingest.us.sentry.io/api/4509321613606912/envelope/?sentry_version=7&sentry_key=1aac12975d22b96f04a640484ac4e5d7&sentry_client=sentry.javascript.nextjs%2F9.22.0 429 (Too Many Requests)
makeRequest @ fetch.js:53
requestTask @ base.js:65
add @ promisebuffer.js:48
send @ base.js:82
sendReplayRequest @ index.js:8190
await in sendReplayRequest
sendReplay @ index.js:8255
_runFlush @ index.js:9444
await in _runFlush
_flush @ index.js:9532
ReplayContainer._debouncedFlush.debounce.maxWait @ index.js:8462
invokeFunc @ index.js:7779
sentryWrapped @ helpers.js:107
setTimeout
eval @ browserapierrors.js:103
setTimeout @ getNativeImplementation.js:128
debounced @ index.js:7803
_flush @ index.js:9516
ReplayContainer._debouncedFlush.debounce.maxWait @ index.js:8462
invokeFunc @ index.js:7779
flush @ index.js:7791
flushImmediate @ index.js:8965
sendBufferedReplayOrFlush @ index.js:8844
eval @ index.js:6420
sentryWrapped @ helpers.js:107
setTimeout
eval @ browserapierrors.js:103
setTimeout @ getNativeImplementation.js:128
handleErrorEvent @ index.js:6417
eval @ index.js:6378
eval @ client.js:494
emit @ client.js:494
eval @ client.js:403
Promise.then
sendEvent @ client.js:403
eval @ client.js:779
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
setResult @ syncpromise.js:178
resolve @ syncpromise.js:182
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
setResult @ syncpromise.js:178
resolve @ syncpromise.js:182
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
setResult @ syncpromise.js:178
resolve @ syncpromise.js:182
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
setResult @ syncpromise.js:178
resolve @ syncpromise.js:182
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
setResult @ syncpromise.js:178
resolve @ syncpromise.js:182
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
setResult @ syncpromise.js:178
resolve @ syncpromise.js:182
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
setResult @ syncpromise.js:178
resolve @ syncpromise.js:182
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
setResult @ syncpromise.js:178
resolve @ syncpromise.js:182
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
setResult @ syncpromise.js:178
resolve @ syncpromise.js:182
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
setResult @ syncpromise.js:178
resolve @ syncpromise.js:182
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
setResult @ syncpromise.js:178
resolve @ syncpromise.js:182
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
setResult @ syncpromise.js:178
resolve @ syncpromise.js:182
eval @ syncpromise.js:76
eval @ syncpromise.js:152
_executeHandlers @ syncpromise.js:146
eval @ syncpromise.js:94
_runExecutor @ syncpromise.js:190
SyncPromise @ syncpromise.js:58
then @ syncpromise.js:66
eval @ eventProcessors.js:34
Promise.then
eval @ eventProcessors.js:34
_runExecutor @ syncpromise.js:190
SyncPromise @ syncpromise.js:58
notifyEventProcessors @ eventProcessors.js:23
eval @ eventProcessors.js:37
_runExecutor @ syncpromise.js:190
SyncPromise @ syncpromise.js:58
notifyEventProcessors @ eventProcessors.js:23
eval @ eventProcessors.js:37
_runExecutor @ syncpromise.js:190
SyncPromise @ syncpromise.js:58
notifyEventProcessors @ eventProcessors.js:23
eval @ eventProcessors.js:37
_runExecutor @ syncpromise.js:190
SyncPromise @ syncpromise.js:58
notifyEventProcessors @ eventProcessors.js:23
eval @ eventProcessors.js:37
_runExecutor @ syncpromise.js:190
SyncPromise @ syncpromise.js:58
notifyEventProcessors @ eventProcessors.js:23
eval @ eventProcessors.js:37
_runExecutor @ syncpromise.js:190
SyncPromise @ syncpromise.js:58
notifyEventProcessors @ eventProcessors.js:23
eval @ eventProcessors.js:37
_runExecutor @ syncpromise.js:190
SyncPromise @ syncpromise.js:58
notifyEventProcessors @ eventProcessors.js:23
eval @ eventProcessors.js:37
_runExecutor @ syncpromise.js:190
SyncPromise @ syncpromise.js:58
notifyEventProcessors @ eventProcessors.js:23
eval @ eventProcessors.js:37
_runExecutor @ syncpromise.js:190
SyncPromise @ syncpromise.js:58
notifyEventProcessors @ eventProcessors.js:23
prepareEvent @ prepareEvent.js:117
_prepareEvent @ client.js:625
_prepareEvent @ client.js:114
_processEvent @ client.js:725
_captureEvent @ client.js:664
captureEvent @ client.js:239
captureEvent @ scope.js:573
captureEvent @ exports.js:77
eval @ globalhandlers.js:70
triggerHandlers @ handlers.js:56
_worldwide_js__WEBPACK_IMPORTED_MODULE_1__.GLOBAL_OBJ.onerror @ globalError.js:43
onUncaughtError @ error-boundary-callbacks.js:83
onCaughtError @ error-boundary-callbacks.js:41
logCaughtError @ react-dom-client.development.js:7794
runWithFiberInDEV @ react-dom-client.development.js:1511
inst.componentDidCatch.update.callback @ react-dom-client.development.js:7841
callCallback @ react-dom-client.development.js:4589
commitCallbacks @ react-dom-client.development.js:4609
runWithFiberInDEV @ react-dom-client.development.js:1511
commitClassCallbacks @ react-dom-client.development.js:10677
commitLayoutEffectOnFiber @ react-dom-client.development.js:11284
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11212
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11207
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11389
recursivelyTraverseLayoutEffects @ react-dom-client.development.js:12195
commitLayoutEffectOnFiber @ react-dom-client.development.js:11289
flushLayoutEffects @ react-dom-client.development.js:15547
commitRoot @ react-dom-client.development.js:15390
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<div>
HomePage @ page.tsx:17
eval @ react-server-dom-webpack-client.browser.development.js:2335
initializeModelChunk @ react-server-dom-webpack-client.browser.development.js:1034
readChunk @ react-server-dom-webpack-client.browser.development.js:929
react-stack-bottom-frame @ react-dom-client.development.js:24059
createChild @ react-dom-client.development.js:6872
reconcileChildrenArray @ react-dom-client.development.js:7179
reconcileChildFibersImpl @ react-dom-client.development.js:7502
eval @ react-dom-client.development.js:7607
reconcileChildren @ react-dom-client.development.js:8048
beginWork @ react-dom-client.development.js:10293
runWithFiberInDEV @ react-dom-client.development.js:1511
performUnitOfWork @ react-dom-client.development.js:15120
workLoopSync @ react-dom-client.development.js:14944
renderRootSync @ react-dom-client.development.js:14924
performWorkOnRoot @ react-dom-client.development.js:14411
performSyncWorkOnRoot @ react-dom-client.development.js:16290
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16138
flushSpawnedWork @ react-dom-client.development.js:15665
commitRoot @ react-dom-client.development.js:15391
commitRootWhenReady @ react-dom-client.development.js:14644
performWorkOnRoot @ react-dom-client.development.js:14567
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16275
performWorkUntilDeadline @ scheduler.development.js:45
<HomePage>
buildFakeTask @ react-server-dom-webpack-client.browser.development.js:2020
initializeFakeTask @ react-server-dom-webpack-client.browser.development.js:2007
resolveDebugInfo @ react-server-dom-webpack-client.browser.development.js:2043
processFullStringRow @ react-server-dom-webpack-client.browser.development.js:2241
processFullBinaryRow @ react-server-dom-webpack-client.browser.development.js:2213
progress @ react-server-dom-webpack-client.browser.development.js:2459
"use server"
ResponseInstance @ react-server-dom-webpack-client.browser.development.js:1567
createResponseFromOptions @ react-server-dom-webpack-client.browser.development.js:2376
exports.createFromReadableStream @ react-server-dom-webpack-client.browser.development.js:2696
eval @ app-index.js:133
(app-pages-browser)/./node_modules/next/dist/client/app-index.js @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:2635
options.factory @ webpack.js?v=1748786439156:712
__webpack_require__ @ webpack.js?v=1748786439156:37
fn @ webpack.js?v=1748786439156:369
eval @ app-next-dev.js:10
eval @ app-bootstrap.js:62
loadScriptsInSequence @ app-bootstrap.js:23
appBootstrap @ app-bootstrap.js:56
eval @ app-next-dev.js:9
(app-pages-browser)/./node_modules/next/dist/client/app-next-dev.js @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:2657
options.factory @ webpack.js?v=1748786439156:712
__webpack_require__ @ webpack.js?v=1748786439156:37
__webpack_exec__ @ main-app.js?v=1748786439156:34
(anonymous) @ main-app.js?v=1748786439156:35
__webpack_require__.O @ webpack.js?v=1748786439156:84
webpackJsonpCallback @ webpack.js?v=1748786439156:1398
(anonymous) @ vendors-_app-pages-browser_node_modules_next_dist_compiled_next_react-refresh-utils_dist_runt-6bd887.js?v=1748786439156:9


    
    IF v_event_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Build result with function context
    SELECT json_build_object(
        'event', row_to_json(e.*),
        'function', (
            SELECT row_to_json(f.*)
            FROM functions f
            WHERE f.function_id = e.function_id
        ),
        'location', (
            SELECT row_to_json(l.*)
            FROM locations l
            WHERE l.location_id = e.location_id
        ),
        'organisation', (
            SELECT row_to_json(o.*)
            FROM organisations o
            WHERE o.organisation_id = e.organiser_id
        ),
        'packages', COALESCE(
            (SELECT json_agg(row_to_json(p.*))
            FROM packages p
            WHERE p.function_id = v_function_id
              AND p.is_active = true
            ), '[]'::json
        ),
        'tickets', COALESCE(
            (SELECT json_agg(ticket_data ORDER BY created_at)
            FROM (
                SELECT 
                    json_build_object(
                        'id', et.event_ticket_id,  -- Fixed: was et.id
                        'event_ticket_id', et.event_ticket_id,  -- Include both for compatibility
                        'name', et.name,
                        'description', et.description,
                        'price', et.price,
                        'total_capacity', et.total_capacity,
                        'available_count', et.available_count,
                        'is_active', et.is_active,
                        'display_order', ROW_NUMBER() OVER (ORDER BY et.created_at),
                        'eligibility_type', COALESCE(et.eligibility_criteria->>'type', 'General')
                    ) as ticket_data,
                    et.created_at
                FROM event_tickets et
                WHERE et.event_id = v_event_id
                  AND et.is_active = true
            ) t
            ), '[]'::json
        ),
        'related_events', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'event_id', re.event_id,
                    'title', re.title,
                    'slug', re.slug,
                    'event_start', re.event_start,
                    'event_end', re.event_end
                )
                ORDER BY re.event_start
            )
            FROM events re
            WHERE re.function_id = v_function_id
              AND re.event_id != v_event_id
              AND re.is_published = true
            ), '[]'::json
        ),
        'summary', json_build_object(
            'min_price', COALESCE(
                (SELECT MIN(et.price) 
                 FROM event_tickets et 
                 WHERE et.event_id = v_event_id 
                   AND et.is_active = true),
                0
            ),
            'max_price', COALESCE(
                (SELECT MAX(et.price) 
                 FROM event_tickets et 
                 WHERE et.event_id = v_event_id 
                   AND et.is_active = true),
                0
            ),
            'total_capacity', COALESCE(
                (SELECT SUM(et.total_capacity) 
                 FROM event_tickets et 
                 WHERE et.event_id = v_event_id 
                   AND et.is_active = true),
                0
            ),
            'tickets_sold', COALESCE(
                (SELECT SUM(et.sold_count) 
                 FROM event_tickets et 
                 WHERE et.event_id = v_event_id),
                0
            ),
            'is_sold_out', COALESCE(
                (SELECT SUM(et.available_count) = 0
                 FROM event_tickets et 
                 WHERE et.event_id = v_event_id 
                   AND et.is_active = true),
                false
            )
        )
    ) INTO v_result
    FROM events e
    WHERE e.event_id = v_event_id;
    
    RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_event_with_details TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION get_event_with_details(TEXT) IS 'Retrieves comprehensive event details including function, location, packages, tickets, and related events';