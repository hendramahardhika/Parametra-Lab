import { lazy, Suspense, type ComponentType } from 'react';
// A bundled, browser-only replacement: no module requests or server are needed.
export default function dynamic<P extends object>(loader:()=>Promise<{default:ComponentType<P>}>,options:{ssr?:boolean;loading?:ComponentType}={}){
 const Component=lazy(loader);const Loading=options.loading;
 return function LocalDynamic(props:P){return <Suspense fallback={Loading?<Loading/>:null}><Component {...props}/></Suspense>};
}
