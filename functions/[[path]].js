var manifest = {
	"/": [
	{
		type: "script",
		href: "/assets/index-29fa5fec.js"
	},
	{
		type: "script",
		href: "/assets/entry-client-fccfd2e7.js"
	},
	{
		type: "style",
		href: "/assets/entry-client-e9f0c8d5.css"
	}
],
	"entry-client": [
	{
		type: "script",
		href: "/assets/entry-client-fccfd2e7.js"
	},
	{
		type: "style",
		href: "/assets/entry-client-e9f0c8d5.css"
	}
],
	"index.html": [
]
};

const ERROR = Symbol("error");
function castError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : "Unknown error", {
    cause: err
  });
}
function handleError(err, owner = Owner) {
  const fns = owner && owner.context && owner.context[ERROR];
  const error = castError(err);
  if (!fns) throw error;
  try {
    for (const f of fns) f(error);
  } catch (e) {
    handleError(e, owner && owner.owner || null);
  }
}
const UNOWNED = {
  context: null,
  owner: null,
  owned: null,
  cleanups: null
};
let Owner = null;
function createOwner() {
  const o = {
    owner: Owner,
    context: Owner ? Owner.context : null,
    owned: null,
    cleanups: null
  };
  if (Owner) {
    if (!Owner.owned) Owner.owned = [o];else Owner.owned.push(o);
  }
  return o;
}
function createRoot(fn, detachedOwner) {
  const owner = Owner,
    current = detachedOwner === undefined ? owner : detachedOwner,
    root = fn.length === 0 ? UNOWNED : {
      context: current ? current.context : null,
      owner: current,
      owned: null,
      cleanups: null
    };
  Owner = root;
  let result;
  try {
    result = fn(fn.length === 0 ? () => {} : () => cleanNode(root));
  } catch (err) {
    handleError(err);
  } finally {
    Owner = owner;
  }
  return result;
}
function createSignal(value, options) {
  return [() => value, v => {
    return value = typeof v === "function" ? v(value) : v;
  }];
}
function createComputed(fn, value) {
  Owner = createOwner();
  try {
    fn(value);
  } catch (err) {
    handleError(err);
  } finally {
    Owner = Owner.owner;
  }
}
const createRenderEffect = createComputed;
function createMemo(fn, value) {
  Owner = createOwner();
  let v;
  try {
    v = fn(value);
  } catch (err) {
    handleError(err);
  } finally {
    Owner = Owner.owner;
  }
  return () => v;
}
function batch(fn) {
  return fn();
}
const untrack = batch;
function on(deps, fn, options = {}) {
  const isArray = Array.isArray(deps);
  const defer = options.defer;
  return () => {
    if (defer) return undefined;
    let value;
    if (isArray) {
      value = [];
      for (let i = 0; i < deps.length; i++) value.push(deps[i]());
    } else value = deps();
    return fn(value);
  };
}
function onCleanup(fn) {
  if (Owner) {
    if (!Owner.cleanups) Owner.cleanups = [fn];else Owner.cleanups.push(fn);
  }
  return fn;
}
function cleanNode(node) {
  if (node.owned) {
    for (let i = 0; i < node.owned.length; i++) cleanNode(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (let i = 0; i < node.cleanups.length; i++) node.cleanups[i]();
    node.cleanups = null;
  }
}
function catchError(fn, handler) {
  const owner = createOwner();
  owner.context = {
    ...owner.context,
    [ERROR]: [handler]
  };
  Owner = owner;
  try {
    return fn();
  } catch (err) {
    handleError(err);
  } finally {
    Owner = Owner.owner;
  }
}
function createContext(defaultValue) {
  const id = Symbol("context");
  return {
    id,
    Provider: createProvider(id),
    defaultValue
  };
}
function useContext(context) {
  return Owner && Owner.context && Owner.context[context.id] !== undefined ? Owner.context[context.id] : context.defaultValue;
}
function getOwner() {
  return Owner;
}
function children(fn) {
  const memo = createMemo(() => resolveChildren(fn()));
  memo.toArray = () => {
    const c = memo();
    return Array.isArray(c) ? c : c != null ? [c] : [];
  };
  return memo;
}
function runWithOwner(o, fn) {
  const prev = Owner;
  Owner = o;
  try {
    return fn();
  } catch (err) {
    handleError(err);
  } finally {
    Owner = prev;
  }
}
function resolveChildren(children) {
  if (typeof children === "function" && !children.length) return resolveChildren(children());
  if (Array.isArray(children)) {
    const results = [];
    for (let i = 0; i < children.length; i++) {
      const result = resolveChildren(children[i]);
      Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
    }
    return results;
  }
  return children;
}
function createProvider(id) {
  return function provider(props) {
    return createMemo(() => {
      Owner.context = {
        ...Owner.context,
        [id]: props.value
      };
      return children(() => props.children);
    });
  };
}

function resolveSSRNode$1(node) {
  const t = typeof node;
  if (t === "string") return node;
  if (node == null || t === "boolean") return "";
  if (Array.isArray(node)) {
    let prev = {};
    let mapped = "";
    for (let i = 0, len = node.length; i < len; i++) {
      if (typeof prev !== "object" && typeof node[i] !== "object") mapped += `<!--!$-->`;
      mapped += resolveSSRNode$1(prev = node[i]);
    }
    return mapped;
  }
  if (t === "object") return node.t;
  if (t === "function") return resolveSSRNode$1(node());
  return String(node);
}
const sharedConfig = {
  context: undefined,
  getContextId() {
    if (!this.context) throw new Error(`getContextId cannot be used under non-hydrating context`);
    return getContextId(this.context.count);
  },
  getNextContextId() {
    if (!this.context) throw new Error(`getNextContextId cannot be used under non-hydrating context`);
    return getContextId(this.context.count++);
  }
};
function getContextId(count) {
  const num = String(count),
    len = num.length - 1;
  return sharedConfig.context.id + (len ? String.fromCharCode(96 + len) : "") + num;
}
function setHydrateContext(context) {
  sharedConfig.context = context;
}
function nextHydrateContext() {
  return sharedConfig.context ? {
    ...sharedConfig.context,
    id: sharedConfig.getNextContextId(),
    count: 0
  } : undefined;
}
function createUniqueId() {
  return sharedConfig.getNextContextId();
}
function createComponent(Comp, props) {
  if (sharedConfig.context && !sharedConfig.context.noHydrate) {
    const c = sharedConfig.context;
    setHydrateContext(nextHydrateContext());
    const r = Comp(props || {});
    setHydrateContext(c);
    return r;
  }
  return Comp(props || {});
}
function simpleMap(props, wrap) {
  const list = props.each || [],
    len = list.length,
    fn = props.children;
  if (len) {
    let mapped = Array(len);
    for (let i = 0; i < len; i++) mapped[i] = wrap(fn, list[i], i);
    return mapped;
  }
  return props.fallback;
}
function For(props) {
  return simpleMap(props, (fn, item, i) => fn(item, () => i));
}
function Show(props) {
  let c;
  return props.when ? typeof (c = props.children) === "function" ? c(props.keyed ? props.when : () => props.when) : c : props.fallback || "";
}
function ErrorBoundary$1(props) {
  let error,
    res,
    clean,
    sync = true;
  const ctx = sharedConfig.context;
  const id = sharedConfig.getContextId();
  function displayFallback() {
    cleanNode(clean);
    ctx.serialize(id, error);
    setHydrateContext({
      ...ctx,
      count: 0
    });
    const f = props.fallback;
    return typeof f === "function" && f.length ? f(error, () => {}) : f;
  }
  createMemo(() => {
    clean = Owner;
    return catchError(() => res = props.children, err => {
      error = err;
      !sync && ctx.replace("e" + id, displayFallback);
      sync = true;
    });
  });
  if (error) return displayFallback();
  sync = false;
  return {
    t: `<!--!$e${id}-->${resolveSSRNode$1(res)}<!--!$/e${id}-->`
  };
}
const SuspenseContext = createContext();
let resourceContext = null;
function createResource(source, fetcher, options = {}) {
  if (arguments.length === 2) {
    if (typeof fetcher === "object") {
      options = fetcher;
      fetcher = source;
      source = true;
    }
  } else if (arguments.length === 1) {
    fetcher = source;
    source = true;
  }
  const contexts = new Set();
  const id = sharedConfig.getNextContextId();
  let resource = {};
  let value = options.storage ? options.storage(options.initialValue)[0]() : options.initialValue;
  let p;
  let error;
  if (sharedConfig.context.async && options.ssrLoadFrom !== "initial") {
    resource = sharedConfig.context.resources[id] || (sharedConfig.context.resources[id] = {});
    if (resource.ref) {
      if (!resource.data && !resource.ref[0].loading && !resource.ref[0].error) resource.ref[1].refetch();
      return resource.ref;
    }
  }
  const read = () => {
    if (error) throw error;
    const resolved = options.ssrLoadFrom !== "initial" && sharedConfig.context.async && "data" in sharedConfig.context.resources[id];
    if (!resolved && resourceContext) resourceContext.push(id);
    if (!resolved && read.loading) {
      const ctx = useContext(SuspenseContext);
      if (ctx) {
        ctx.resources.set(id, read);
        contexts.add(ctx);
      }
    }
    return resolved ? sharedConfig.context.resources[id].data : value;
  };
  read.loading = false;
  read.error = undefined;
  read.state = "initialValue" in options ? "ready" : "unresolved";
  Object.defineProperty(read, "latest", {
    get() {
      return read();
    }
  });
  function load() {
    const ctx = sharedConfig.context;
    if (!ctx.async) return read.loading = !!(typeof source === "function" ? source() : source);
    if (ctx.resources && id in ctx.resources && "data" in ctx.resources[id]) {
      value = ctx.resources[id].data;
      return;
    }
    let lookup;
    try {
      resourceContext = [];
      lookup = typeof source === "function" ? source() : source;
      if (resourceContext.length) return;
    } finally {
      resourceContext = null;
    }
    if (!p) {
      if (lookup == null || lookup === false) return;
      p = fetcher(lookup, {
        value
      });
    }
    if (p != undefined && typeof p === "object" && "then" in p) {
      read.loading = true;
      read.state = "pending";
      p = p.then(res => {
        read.loading = false;
        read.state = "ready";
        ctx.resources[id].data = res;
        p = null;
        notifySuspense(contexts);
        return res;
      }).catch(err => {
        read.loading = false;
        read.state = "errored";
        read.error = error = castError(err);
        p = null;
        notifySuspense(contexts);
        throw error;
      });
      if (ctx.serialize) ctx.serialize(id, p, options.deferStream);
      return p;
    }
    ctx.resources[id].data = p;
    if (ctx.serialize) ctx.serialize(id, p);
    p = null;
    return ctx.resources[id].data;
  }
  if (options.ssrLoadFrom !== "initial") load();
  return resource.ref = [read, {
    refetch: load,
    mutate: v => value = v
  }];
}
function suspenseComplete(c) {
  for (const r of c.resources.values()) {
    if (r.loading) return false;
  }
  return true;
}
function notifySuspense(contexts) {
  for (const c of contexts) {
    if (!suspenseComplete(c)) {
      continue;
    }
    c.completed();
    contexts.delete(c);
  }
}
function startTransition(fn) {
  fn();
}
function Suspense(props) {
  let done;
  const ctx = sharedConfig.context;
  const id = sharedConfig.getContextId();
  const o = createOwner();
  const value = ctx.suspense[id] || (ctx.suspense[id] = {
    resources: new Map(),
    completed: () => {
      const res = runSuspense();
      if (suspenseComplete(value)) {
        done(resolveSSRNode$1(res));
      }
    }
  });
  function suspenseError(err) {
    if (!done || !done(undefined, err)) {
      runWithOwner(o.owner, () => {
        throw err;
      });
    }
  }
  function runSuspense() {
    setHydrateContext({
      ...ctx,
      count: 0
    });
    cleanNode(o);
    return runWithOwner(o, () => createComponent(SuspenseContext.Provider, {
      value,
      get children() {
        return catchError(() => props.children, suspenseError);
      }
    }));
  }
  const res = runSuspense();
  if (suspenseComplete(value)) {
    delete ctx.suspense[id];
    return res;
  }
  done = ctx.async ? ctx.registerFragment(id) : undefined;
  return catchError(() => {
    if (ctx.async) {
      setHydrateContext({
        ...ctx,
        count: 0,
        id: ctx.id + "0F",
        noHydrate: true
      });
      const res = {
        t: `<template id="pl-${id}"></template>${resolveSSRNode$1(props.fallback)}<!--pl-${id}-->`
      };
      setHydrateContext(ctx);
      return res;
    }
    setHydrateContext({
      ...ctx,
      count: 0,
      id: ctx.id + "0F"
    });
    ctx.serialize(id, "$$f");
    return props.fallback;
  }, suspenseError);
}

var T=(o=>(o[o.AggregateError=1]="AggregateError",o[o.ArrowFunction=2]="ArrowFunction",o[o.ErrorPrototypeStack=4]="ErrorPrototypeStack",o[o.ObjectAssign=8]="ObjectAssign",o[o.BigIntTypedArray=16]="BigIntTypedArray",o))(T||{});function gr(n){switch(n){case'"':return '\\"';case"\\":return "\\\\";case`
`:return "\\n";case"\r":return "\\r";case"\b":return "\\b";case"	":return "\\t";case"\f":return "\\f";case"<":return "\\x3C";case"\u2028":return "\\u2028";case"\u2029":return "\\u2029";default:return}}function d$1(n){let e="",r=0,t;for(let s=0,o=n.length;s<o;s++)t=gr(n[s]),t&&(e+=n.slice(r,s)+t,r=s+1);return r===0?e=n:e+=n.slice(r),e}var I$1="__SEROVAL_REFS__",G$1="$R",re=`self.${G$1}`;function hr(n){return n==null?`${re}=${re}||[]`:`(${re}=${re}||{})["${d$1(n)}"]=[]`}function f$1(n,e){if(!n)throw e}var Ve=new Map,R=new Map;function te$1(n){return Ve.has(n)}function Ue(n){return f$1(te$1(n),new ne(n)),Ve.get(n)}typeof globalThis!="undefined"?Object.defineProperty(globalThis,I$1,{value:R,configurable:!0,writable:!1,enumerable:!1}):typeof window!="undefined"?Object.defineProperty(window,I$1,{value:R,configurable:!0,writable:!1,enumerable:!1}):typeof self!="undefined"?Object.defineProperty(self,I$1,{value:R,configurable:!0,writable:!1,enumerable:!1}):typeof global!="undefined"&&Object.defineProperty(global,I$1,{value:R,configurable:!0,writable:!1,enumerable:!1});function Mr(n){return n}function Ke(n,e){for(let r=0,t=e.length;r<t;r++){let s=e[r];n.has(s)||(n.add(s),s.extends&&Ke(n,s.extends));}}function c(n){if(n){let e=new Set;return Ke(e,n),[...e]}}var Le={0:"Symbol.asyncIterator",1:"Symbol.hasInstance",2:"Symbol.isConcatSpreadable",3:"Symbol.iterator",4:"Symbol.match",5:"Symbol.matchAll",6:"Symbol.replace",7:"Symbol.search",8:"Symbol.species",9:"Symbol.split",10:"Symbol.toPrimitive",11:"Symbol.toStringTag",12:"Symbol.unscopables"},oe={[Symbol.asyncIterator]:0,[Symbol.hasInstance]:1,[Symbol.isConcatSpreadable]:2,[Symbol.iterator]:3,[Symbol.match]:4,[Symbol.matchAll]:5,[Symbol.replace]:6,[Symbol.search]:7,[Symbol.species]:8,[Symbol.split]:9,[Symbol.toPrimitive]:10,[Symbol.toStringTag]:11,[Symbol.unscopables]:12},Ye={2:"!0",3:"!1",1:"void 0",0:"null",4:"-0",5:"1/0",6:"-1/0",7:"0/0"};var ie={0:"Error",1:"EvalError",2:"RangeError",3:"ReferenceError",4:"SyntaxError",5:"TypeError",6:"URIError"};function v(n){return {t:2,i:void 0,s:n,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}var N=v(2),b=v(3),ae$1=v(1),le=v(0),qe=v(4),He=v(5),Ze=v(6),Xe=v(7);function ue(n){return n instanceof EvalError?1:n instanceof RangeError?2:n instanceof ReferenceError?3:n instanceof SyntaxError?4:n instanceof TypeError?5:n instanceof URIError?6:0}function Nr(n){let e=ie[ue(n)];return n.name!==e?{name:n.name}:n.constructor.name!==e?{name:n.constructor.name}:{}}function k(n,e){let r=Nr(n),t=Object.getOwnPropertyNames(n);for(let s=0,o=t.length,i;s<o;s++)i=t[s],i!=="name"&&i!=="message"&&(i==="stack"?e&4&&(r=r||{},r[i]=n[i]):(r=r||{},r[i]=n[i]));return r}function de(n){return Object.isFrozen(n)?3:Object.isSealed(n)?2:Object.isExtensible(n)?0:1}function ce(n){switch(n){case Number.POSITIVE_INFINITY:return He;case Number.NEGATIVE_INFINITY:return Ze}return n!==n?Xe:Object.is(n,-0)?qe:{t:0,i:void 0,s:n,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}function x$1(n){return {t:1,i:void 0,s:d$1(n),l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}function fe(n){return {t:3,i:void 0,s:""+n,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}function er(n){return {t:4,i:n,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}function pe(n,e){return {t:5,i:n,s:e.toISOString(),l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,f:void 0,a:void 0,b:void 0,o:void 0}}function me(n,e){return {t:6,i:n,s:void 0,l:void 0,c:d$1(e.source),m:e.flags,p:void 0,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}function ge(n,e){let r=new Uint8Array(e),t=r.length,s=new Array(t);for(let o=0;o<t;o++)s[o]=r[o];return {t:19,i:n,s,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}function rr(n,e){return {t:17,i:n,s:oe[e],l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}function De(n,e){return {t:18,i:n,s:d$1(Ue(e)),l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}function F$1(n,e,r){return {t:25,i:n,s:r,l:void 0,c:d$1(e),m:void 0,p:void 0,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}function Se(n,e,r){return {t:9,i:n,s:void 0,l:e.length,c:void 0,m:void 0,p:void 0,e:void 0,a:r,f:void 0,b:void 0,o:de(e)}}function he(n,e){return {t:21,i:n,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:e,b:void 0,o:void 0}}function ye(n,e,r){return {t:15,i:n,s:void 0,l:e.length,c:e.constructor.name,m:void 0,p:void 0,e:void 0,a:void 0,f:r,b:e.byteOffset,o:void 0}}function ve(n,e,r){return {t:16,i:n,s:void 0,l:e.length,c:e.constructor.name,m:void 0,p:void 0,e:void 0,a:void 0,f:r,b:e.byteOffset,o:void 0}}function Ne(n,e,r){return {t:20,i:n,s:void 0,l:e.byteLength,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:r,b:e.byteOffset,o:void 0}}function be(n,e,r){return {t:13,i:n,s:ue(e),l:void 0,c:void 0,m:d$1(e.message),p:r,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}function xe(n,e,r){return {t:14,i:n,s:ue(e),l:void 0,c:void 0,m:d$1(e.message),p:r,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}function Ae(n,e,r){return {t:7,i:n,s:void 0,l:e,c:void 0,m:void 0,p:void 0,e:void 0,a:r,f:void 0,b:void 0,o:void 0}}function V$1(n,e){return {t:28,i:void 0,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:[n,e],f:void 0,b:void 0,o:void 0}}function D(n,e){return {t:30,i:void 0,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:[n,e],f:void 0,b:void 0,o:void 0}}function B$1(n,e,r){return {t:31,i:n,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:r,f:e,b:void 0,o:void 0}}function Ie(n,e){return {t:32,i:n,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:e,b:void 0,o:void 0}}function Re(n,e){return {t:33,i:n,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:e,b:void 0,o:void 0}}function Ee(n,e){return {t:34,i:n,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:e,b:void 0,o:void 0}}var{toString:Be}=Object.prototype;function br(n,e){return e instanceof Error?`Seroval caught an error during the ${n} process.
  
${e.name}
${e.message}

- For more information, please check the "cause" property of this error.
- If you believe this is an error in Seroval, please submit an issue at https://github.com/lxsmnsyc/seroval/issues/new`:`Seroval caught an error during the ${n} process.

"${Be.call(e)}"

For more information, please check the "cause" property of this error.`}var q$1=class q extends Error{constructor(r,t){super(br(r,t));this.cause=t;}},j=class extends q$1{constructor(e){super("parsing",e);}},we=class extends q$1{constructor(e){super("serialization",e);}},p$1=class p extends Error{constructor(r){super(`The value ${Be.call(r)} of type "${typeof r}" cannot be parsed/serialized.
      
There are few workarounds for this problem:
- Transform the value in a way that it can be serialized.
- If the reference is present on multiple runtimes (isomorphic), you can use the Reference API to map the references.`);this.value=r;}},m$1=class m extends Error{constructor(e){super('Unsupported node type "'+e.t+'".');}},_$1=class _ extends Error{constructor(e){super('Missing plugin for tag "'+e+'".');}},ne=class extends Error{constructor(r){super('Missing reference for the value "'+Be.call(r)+'" of type "'+typeof r+'"');this.value=r;}};var E$1=class E{constructor(e,r){this.value=e;this.replacement=r;}};var tr={},nr={};var sr={0:{},1:{},2:{},3:{},4:{}};function Ce(n){return "__SEROVAL_STREAM__"in n}function M$1(){let n=new Set,e=[],r=!0,t=!0;function s(a){for(let l of n.keys())l.next(a);}function o(a){for(let l of n.keys())l.throw(a);}function i(a){for(let l of n.keys())l.return(a);}return {__SEROVAL_STREAM__:!0,on(a){r&&n.add(a);for(let l=0,u=e.length;l<u;l++){let S=e[l];l===u-1&&!r?t?a.return(S):a.throw(S):a.next(S);}return ()=>{r&&n.delete(a);}},next(a){r&&(e.push(a),s(a));},throw(a){r&&(e.push(a),o(a),r=!1,t=!1,n.clear());},return(a){r&&(e.push(a),i(a),r=!1,t=!0,n.clear());}}}function ze(n){let e=M$1(),r=n[Symbol.asyncIterator]();async function t(){try{let s=await r.next();s.done?e.return(s.value):(e.next(s.value),await t());}catch(s){e.throw(s);}}return t().catch(()=>{}),e}function U(n){let e=[],r=-1,t=-1,s=n[Symbol.iterator]();for(;;)try{let o=s.next();if(e.push(o.value),o.done){t=e.length-1;break}}catch(o){r=e.length,e.push(o);}return {v:e,t:r,d:t}}var W=class{constructor(e){this.marked=new Set;this.plugins=e.plugins,this.features=31^(e.disabledFeatures||0),this.refs=e.refs||new Map;}markRef(e){this.marked.add(e);}isMarked(e){return this.marked.has(e)}getIndexedValue(e){let r=this.refs.get(e);if(r!=null)return this.markRef(r),{type:1,value:er(r)};let t=this.refs.size;return this.refs.set(e,t),{type:0,value:t}}getReference(e){let r=this.getIndexedValue(e);return r.type===1?r:te$1(e)?{type:2,value:De(r.value,e)}:r}getStrictReference(e){f$1(te$1(e),new p$1(e));let r=this.getIndexedValue(e);return r.type===1?r.value:De(r.value,e)}parseFunction(e){return this.getStrictReference(e)}parseWellKnownSymbol(e){let r=this.getReference(e);return r.type!==0?r.value:(f$1(e in oe,new p$1(e)),rr(r.value,e))}parseSpecialReference(e){let r=this.getIndexedValue(sr[e]);return r.type===1?r.value:{t:26,i:r.value,s:e,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:void 0,b:void 0,o:void 0}}parseIteratorFactory(){let e=this.getIndexedValue(tr);return e.type===1?e.value:{t:27,i:e.value,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:this.parseWellKnownSymbol(Symbol.iterator),b:void 0,o:void 0}}parseAsyncIteratorFactory(){let e=this.getIndexedValue(nr);return e.type===1?e.value:{t:29,i:e.value,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:[this.parseSpecialReference(1),this.parseWellKnownSymbol(Symbol.asyncIterator)],f:void 0,b:void 0,o:void 0}}createObjectNode(e,r,t,s){return {t:t?11:10,i:e,s:void 0,l:void 0,c:void 0,m:void 0,p:s,e:void 0,a:void 0,f:void 0,b:void 0,o:de(r)}}createMapNode(e,r,t,s){return {t:8,i:e,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:{k:r,v:t,s},a:void 0,f:this.parseSpecialReference(0),b:void 0,o:void 0}}createPromiseConstructorNode(e){return {t:22,i:e,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:void 0,f:this.parseSpecialReference(1),b:void 0,o:void 0}}};var Ar=/^[$A-Z_][0-9A-Z_$]*$/i;function _e(n){let e=n[0];return (e==="$"||e==="_"||e>="A"&&e<="Z"||e>="a"&&e<="z")&&Ar.test(n)}function X$1(n){switch(n.t){case 0:return n.s+"="+n.v;case 2:return n.s+".set("+n.k+","+n.v+")";case 1:return n.s+".add("+n.v+")";case 3:return n.s+".delete("+n.k+")"}}function Ir(n){let e=[],r=n[0];for(let t=1,s=n.length,o,i=r;t<s;t++)o=n[t],o.t===0&&o.v===i.v?r={t:0,s:o.s,k:void 0,v:X$1(r)}:o.t===2&&o.s===i.s?r={t:2,s:X$1(r),k:o.k,v:o.v}:o.t===1&&o.s===i.s?r={t:1,s:X$1(r),k:void 0,v:o.v}:o.t===3&&o.s===i.s?r={t:3,s:X$1(r),k:o.k,v:void 0}:(e.push(r),r=o),i=o;return e.push(r),e}function ur(n){if(n.length){let e="",r=Ir(n);for(let t=0,s=r.length;t<s;t++)e+=X$1(r[t])+",";return e}}var Rr="Object.create(null)",Er="new Set",wr="new Map",Pr="Promise.resolve",Or="Promise.reject",Cr={3:"Object.freeze",2:"Object.seal",1:"Object.preventExtensions",0:void 0},O$1=class O{constructor(e){this.stack=[];this.flags=[];this.assignments=[];this.plugins=e.plugins,this.features=e.features,this.marked=new Set(e.markedRefs);}createFunction(e,r){return this.features&2?(e.length===1?e[0]:"("+e.join(",")+")")+"=>"+(r.startsWith("{")?"("+r+")":r):"function("+e.join(",")+"){return "+r+"}"}createEffectfulFunction(e,r){return this.features&2?(e.length===1?e[0]:"("+e.join(",")+")")+"=>{"+r+"}":"function("+e.join(",")+"){"+r+"}"}markRef(e){this.marked.add(e);}isMarked(e){return this.marked.has(e)}pushObjectFlag(e,r){e!==0&&(this.markRef(r),this.flags.push({type:e,value:this.getRefParam(r)}));}resolveFlags(){let e="";for(let r=0,t=this.flags,s=t.length;r<s;r++){let o=t[r];e+=Cr[o.type]+"("+o.value+"),";}return e}resolvePatches(){let e=ur(this.assignments),r=this.resolveFlags();return e?r?e+r:e:r}createAssignment(e,r){this.assignments.push({t:0,s:e,k:void 0,v:r});}createAddAssignment(e,r){this.assignments.push({t:1,s:this.getRefParam(e),k:void 0,v:r});}createSetAssignment(e,r,t){this.assignments.push({t:2,s:this.getRefParam(e),k:r,v:t});}createDeleteAssignment(e,r){this.assignments.push({t:3,s:this.getRefParam(e),k:r,v:void 0});}createArrayAssign(e,r,t){this.createAssignment(this.getRefParam(e)+"["+r+"]",t);}createObjectAssign(e,r,t){this.createAssignment(this.getRefParam(e)+"."+r,t);}isIndexedValueInStack(e){return e.t===4&&this.stack.includes(e.i)}serializeReference(e){return this.assignIndexedValue(e.i,I$1+'.get("'+e.s+'")')}serializeArrayItem(e,r,t){return r?this.isIndexedValueInStack(r)?(this.markRef(e),this.createArrayAssign(e,t,this.getRefParam(r.i)),""):this.serialize(r):""}serializeArray(e){let r=e.i;if(e.l){this.stack.push(r);let t=e.a,s=this.serializeArrayItem(r,t[0],0),o=s==="";for(let i=1,a=e.l,l;i<a;i++)l=this.serializeArrayItem(r,t[i],i),s+=","+l,o=l==="";return this.stack.pop(),this.pushObjectFlag(e.o,e.i),this.assignIndexedValue(r,"["+s+(o?",]":"]"))}return this.assignIndexedValue(r,"[]")}serializeProperty(e,r,t){if(typeof r=="string"){let s=Number(r),o=s>=0&&s.toString()===r||_e(r);if(this.isIndexedValueInStack(t)){let i=this.getRefParam(t.i);return this.markRef(e.i),o&&s!==s?this.createObjectAssign(e.i,r,i):this.createArrayAssign(e.i,o?r:'"'+r+'"',i),""}return (o?r:'"'+r+'"')+":"+this.serialize(t)}return "["+this.serialize(r)+"]:"+this.serialize(t)}serializeProperties(e,r){let t=r.s;if(t){let s=r.k,o=r.v;this.stack.push(e.i);let i=this.serializeProperty(e,s[0],o[0]);for(let a=1,l=i;a<t;a++)l=this.serializeProperty(e,s[a],o[a]),i+=(l&&i&&",")+l;return this.stack.pop(),"{"+i+"}"}return "{}"}serializeObject(e){return this.pushObjectFlag(e.o,e.i),this.assignIndexedValue(e.i,this.serializeProperties(e,e.p))}serializeWithObjectAssign(e,r,t){let s=this.serializeProperties(e,r);return s!=="{}"?"Object.assign("+t+","+s+")":t}serializeStringKeyAssignment(e,r,t,s){let o=this.serialize(s),i=Number(t),a=i>=0&&i.toString()===t||_e(t);if(this.isIndexedValueInStack(s))a&&i!==i?this.createObjectAssign(e.i,t,o):this.createArrayAssign(e.i,a?t:'"'+t+'"',o);else {let l=this.assignments;this.assignments=r,a&&i!==i?this.createObjectAssign(e.i,t,o):this.createArrayAssign(e.i,a?t:'"'+t+'"',o),this.assignments=l;}}serializeAssignment(e,r,t,s){if(typeof t=="string")this.serializeStringKeyAssignment(e,r,t,s);else {let o=this.stack;this.stack=[];let i=this.serialize(s);this.stack=o;let a=this.assignments;this.assignments=r,this.createArrayAssign(e.i,this.serialize(t),i),this.assignments=a;}}serializeAssignments(e,r){let t=r.s;if(t){let s=[],o=r.k,i=r.v;this.stack.push(e.i);for(let a=0;a<t;a++)this.serializeAssignment(e,s,o[a],i[a]);return this.stack.pop(),ur(s)}}serializeDictionary(e,r){if(e.p)if(this.features&8)r=this.serializeWithObjectAssign(e,e.p,r);else {this.markRef(e.i);let t=this.serializeAssignments(e,e.p);if(t)return "("+this.assignIndexedValue(e.i,r)+","+t+this.getRefParam(e.i)+")"}return this.assignIndexedValue(e.i,r)}serializeNullConstructor(e){return this.pushObjectFlag(e.o,e.i),this.serializeDictionary(e,Rr)}serializeDate(e){return this.assignIndexedValue(e.i,'new Date("'+e.s+'")')}serializeRegExp(e){return this.assignIndexedValue(e.i,"/"+e.c+"/"+e.m)}serializeSetItem(e,r){return this.isIndexedValueInStack(r)?(this.markRef(e),this.createAddAssignment(e,this.getRefParam(r.i)),""):this.serialize(r)}serializeSet(e){let r=Er,t=e.l,s=e.i;if(t){let o=e.a;this.stack.push(s);let i=this.serializeSetItem(s,o[0]);for(let a=1,l=i;a<t;a++)l=this.serializeSetItem(s,o[a]),i+=(l&&i&&",")+l;this.stack.pop(),i&&(r+="(["+i+"])");}return this.assignIndexedValue(s,r)}serializeMapEntry(e,r,t,s){if(this.isIndexedValueInStack(r)){let o=this.getRefParam(r.i);if(this.markRef(e),this.isIndexedValueInStack(t)){let a=this.getRefParam(t.i);return this.createSetAssignment(e,o,a),""}if(t.t!==4&&t.i!=null&&this.isMarked(t.i)){let a="("+this.serialize(t)+",["+s+","+s+"])";return this.createSetAssignment(e,o,this.getRefParam(t.i)),this.createDeleteAssignment(e,s),a}let i=this.stack;return this.stack=[],this.createSetAssignment(e,o,this.serialize(t)),this.stack=i,""}if(this.isIndexedValueInStack(t)){let o=this.getRefParam(t.i);if(this.markRef(e),r.t!==4&&r.i!=null&&this.isMarked(r.i)){let a="("+this.serialize(r)+",["+s+","+s+"])";return this.createSetAssignment(e,this.getRefParam(r.i),o),this.createDeleteAssignment(e,s),a}let i=this.stack;return this.stack=[],this.createSetAssignment(e,this.serialize(r),o),this.stack=i,""}return "["+this.serialize(r)+","+this.serialize(t)+"]"}serializeMap(e){let r=wr,t=e.e.s,s=e.i,o=e.f,i=this.getRefParam(o.i);if(t){let a=e.e.k,l=e.e.v;this.stack.push(s);let u=this.serializeMapEntry(s,a[0],l[0],i);for(let S=1,Fe=u;S<t;S++)Fe=this.serializeMapEntry(s,a[S],l[S],i),u+=(Fe&&u&&",")+Fe;this.stack.pop(),u&&(r+="(["+u+"])");}return o.t===26&&(this.markRef(o.i),r="("+this.serialize(o)+","+r+")"),this.assignIndexedValue(s,r)}serializeArrayBuffer(e){let r="new Uint8Array(",t=e.s,s=t.length;if(s){r+="["+t[0];for(let o=1;o<s;o++)r+=","+t[o];r+="]";}return this.assignIndexedValue(e.i,r+").buffer")}serializeTypedArray(e){return this.assignIndexedValue(e.i,"new "+e.c+"("+this.serialize(e.f)+","+e.b+","+e.l+")")}serializeDataView(e){return this.assignIndexedValue(e.i,"new DataView("+this.serialize(e.f)+","+e.b+","+e.l+")")}serializeAggregateError(e){let r=e.i;this.stack.push(r);let t=this.serializeDictionary(e,'new AggregateError([],"'+e.m+'")');return this.stack.pop(),t}serializeError(e){return this.serializeDictionary(e,"new "+ie[e.s]+'("'+e.m+'")')}serializePromise(e){let r,t=e.f,s=e.i,o=e.s?Pr:Or;if(this.isIndexedValueInStack(t)){let i=this.getRefParam(t.i);r=o+(e.s?"().then("+this.createFunction([],i)+")":"().catch("+this.createEffectfulFunction([],"throw "+i)+")");}else {this.stack.push(s);let i=this.serialize(t);this.stack.pop(),r=o+"("+i+")";}return this.assignIndexedValue(s,r)}serializeWellKnownSymbol(e){return this.assignIndexedValue(e.i,Le[e.s])}serializeBoxed(e){return this.assignIndexedValue(e.i,"Object("+this.serialize(e.f)+")")}serializePlugin(e){let r=this.plugins;if(r)for(let t=0,s=r.length;t<s;t++){let o=r[t];if(o.tag===e.c)return this.assignIndexedValue(e.i,o.serialize(e.s,this,{id:e.i}))}throw new _$1(e.c)}getConstructor(e){let r=this.serialize(e);return r===this.getRefParam(e.i)?r:"("+r+")"}serializePromiseConstructor(e){return this.assignIndexedValue(e.i,this.getConstructor(e.f)+"()")}serializePromiseResolve(e){return this.getConstructor(e.a[0])+"("+this.getRefParam(e.i)+","+this.serialize(e.a[1])+")"}serializePromiseReject(e){return this.getConstructor(e.a[0])+"("+this.getRefParam(e.i)+","+this.serialize(e.a[1])+")"}serializeSpecialReferenceValue(e){switch(e){case 0:return "[]";case 1:return this.createFunction(["s","f","p"],"((p=new Promise("+this.createEffectfulFunction(["a","b"],"s=a,f=b")+")).s=s,p.f=f,p)");case 2:return this.createEffectfulFunction(["p","d"],'p.s(d),p.status="success",p.value=d;delete p.s;delete p.f');case 3:return this.createEffectfulFunction(["p","d"],'p.f(d),p.status="failure",p.value=d;delete p.s;delete p.f');case 4:return this.createFunction(["b","a","s","l","p","f","e","n"],"(b=[],a=!0,s=!1,l=[],p=0,f="+this.createEffectfulFunction(["v","m","x"],"for(x=0;x<p;x++)l[x]&&l[x][m](v)")+",n="+this.createEffectfulFunction(["o","x","z","c"],'for(x=0,z=b.length;x<z;x++)(c=b[x],(!a&&x===z-1)?o[s?"return":"throw"](c):o.next(c))')+",e="+this.createFunction(["o","t"],"(a&&(l[t=p++]=o),n(o),"+this.createEffectfulFunction([],"a&&(l[t]=void 0)")+")")+",{__SEROVAL_STREAM__:!0,on:"+this.createFunction(["o"],"e(o)")+",next:"+this.createEffectfulFunction(["v"],'a&&(b.push(v),f(v,"next"))')+",throw:"+this.createEffectfulFunction(["v"],'a&&(b.push(v),f(v,"throw"),a=s=!1,l.length=0)')+",return:"+this.createEffectfulFunction(["v"],'a&&(b.push(v),f(v,"return"),a=!1,s=!0,l.length=0)')+"})");default:return ""}}serializeSpecialReference(e){return this.assignIndexedValue(e.i,this.serializeSpecialReferenceValue(e.s))}serializeIteratorFactory(e){let r="",t=!1;return e.f.t!==4&&(this.markRef(e.f.i),r="("+this.serialize(e.f)+",",t=!0),r+=this.assignIndexedValue(e.i,this.createFunction(["s"],this.createFunction(["i","c","d","t"],"(i=0,t={["+this.getRefParam(e.f.i)+"]:"+this.createFunction([],"t")+",next:"+this.createEffectfulFunction([],"if(i>s.d)return{done:!0,value:void 0};if(d=s.v[c=i++],c===s.t)throw d;return{done:c===s.d,value:d}")+"})"))),t&&(r+=")"),r}serializeIteratorFactoryInstance(e){return this.getConstructor(e.a[0])+"("+this.serialize(e.a[1])+")"}serializeAsyncIteratorFactory(e){let r=e.a[0],t=e.a[1],s="";r.t!==4&&(this.markRef(r.i),s+="("+this.serialize(r)),t.t!==4&&(this.markRef(t.i),s+=(s?",":"(")+this.serialize(t)),s&&(s+=",");let o=this.assignIndexedValue(e.i,this.createFunction(["s"],this.createFunction(["b","c","p","d","e","t","f"],"(b=[],c=0,p=[],d=-1,e=!1,f="+this.createEffectfulFunction(["i","l"],"for(i=0,l=p.length;i<l;i++)p[i].s({done:!0,value:void 0})")+",s.on({next:"+this.createEffectfulFunction(["v","t"],"if(t=p.shift())t.s({done:!1,value:v});b.push(v)")+",throw:"+this.createEffectfulFunction(["v","t"],"if(t=p.shift())t.f(v);f(),d=b.length,e=!0,b.push(v)")+",return:"+this.createEffectfulFunction(["v","t"],"if(t=p.shift())t.s({done:!0,value:v});f(),d=b.length,b.push(v)")+"}),t={["+this.getRefParam(t.i)+"]:"+this.createFunction([],"t")+",next:"+this.createEffectfulFunction(["i","t","v"],"if(d===-1){return((i=c++)>=b.length)?(p.push(t="+this.getRefParam(r.i)+"()),t):{done:!1,value:b[i]}}if(c>d)return{done:!0,value:void 0};if(v=b[i=c++],i!==d)return{done:!1,value:v};if(e)throw v;return{done:!0,value:v}")+"})")));return s?s+o+")":o}serializeAsyncIteratorFactoryInstance(e){return this.getConstructor(e.a[0])+"("+this.serialize(e.a[1])+")"}serializeStreamConstructor(e){let r=this.assignIndexedValue(e.i,this.getConstructor(e.f)+"()"),t=e.a.length;if(t){let s=this.serialize(e.a[0]);for(let o=1;o<t;o++)s+=","+this.serialize(e.a[o]);return "("+r+","+s+","+this.getRefParam(e.i)+")"}return r}serializeStreamNext(e){return this.getRefParam(e.i)+".next("+this.serialize(e.f)+")"}serializeStreamThrow(e){return this.getRefParam(e.i)+".throw("+this.serialize(e.f)+")"}serializeStreamReturn(e){return this.getRefParam(e.i)+".return("+this.serialize(e.f)+")"}serialize(e){try{switch(e.t){case 2:return Ye[e.s];case 0:return ""+e.s;case 1:return '"'+e.s+'"';case 3:return e.s+"n";case 4:return this.getRefParam(e.i);case 18:return this.serializeReference(e);case 9:return this.serializeArray(e);case 10:return this.serializeObject(e);case 11:return this.serializeNullConstructor(e);case 5:return this.serializeDate(e);case 6:return this.serializeRegExp(e);case 7:return this.serializeSet(e);case 8:return this.serializeMap(e);case 19:return this.serializeArrayBuffer(e);case 16:case 15:return this.serializeTypedArray(e);case 20:return this.serializeDataView(e);case 14:return this.serializeAggregateError(e);case 13:return this.serializeError(e);case 12:return this.serializePromise(e);case 17:return this.serializeWellKnownSymbol(e);case 21:return this.serializeBoxed(e);case 22:return this.serializePromiseConstructor(e);case 23:return this.serializePromiseResolve(e);case 24:return this.serializePromiseReject(e);case 25:return this.serializePlugin(e);case 26:return this.serializeSpecialReference(e);case 27:return this.serializeIteratorFactory(e);case 28:return this.serializeIteratorFactoryInstance(e);case 29:return this.serializeAsyncIteratorFactory(e);case 30:return this.serializeAsyncIteratorFactoryInstance(e);case 31:return this.serializeStreamConstructor(e);case 32:return this.serializeStreamNext(e);case 33:return this.serializeStreamThrow(e);case 34:return this.serializeStreamReturn(e);default:throw new m$1(e)}}catch(r){throw new we(r)}}};var C=class extends O$1{constructor(r){super(r);this.mode="cross";this.scopeId=r.scopeId;}getRefParam(r){return G$1+"["+r+"]"}assignIndexedValue(r,t){return this.getRefParam(r)+"="+t}serializeTop(r){let t=this.serialize(r),s=r.i;if(s==null)return t;let o=this.resolvePatches(),i=this.getRefParam(s),a=this.scopeId==null?"":G$1,l=o?"("+t+","+o+i+")":t;if(a==="")return r.t===10&&!o?"("+l+")":l;let u=this.scopeId==null?"()":"("+G$1+'["'+d$1(this.scopeId)+'"])';return "("+this.createFunction([a],l)+")"+u}};var g$1=class g extends W{parseItems(e){let r=[];for(let t=0,s=e.length;t<s;t++)t in e&&(r[t]=this.parse(e[t]));return r}parseArray(e,r){return Se(e,r,this.parseItems(r))}parseProperties(e){let r=Object.entries(e),t=[],s=[];for(let i=0,a=r.length;i<a;i++)t.push(d$1(r[i][0])),s.push(this.parse(r[i][1]));let o=Symbol.iterator;return o in e&&(t.push(this.parseWellKnownSymbol(o)),s.push(V$1(this.parseIteratorFactory(),this.parse(U(e))))),o=Symbol.asyncIterator,o in e&&(t.push(this.parseWellKnownSymbol(o)),s.push(D(this.parseAsyncIteratorFactory(),this.parse(M$1())))),o=Symbol.toStringTag,o in e&&(t.push(this.parseWellKnownSymbol(o)),s.push(x$1(e[o]))),o=Symbol.isConcatSpreadable,o in e&&(t.push(this.parseWellKnownSymbol(o)),s.push(e[o]?N:b)),{k:t,v:s,s:t.length}}parsePlainObject(e,r,t){return this.createObjectNode(e,r,t,this.parseProperties(r))}parseBoxed(e,r){return he(e,this.parse(r.valueOf()))}parseTypedArray(e,r){return ye(e,r,this.parse(r.buffer))}parseBigIntTypedArray(e,r){return ve(e,r,this.parse(r.buffer))}parseDataView(e,r){return Ne(e,r,this.parse(r.buffer))}parseError(e,r){let t=k(r,this.features);return be(e,r,t?this.parseProperties(t):void 0)}parseAggregateError(e,r){let t=k(r,this.features);return xe(e,r,t?this.parseProperties(t):void 0)}parseMap(e,r){let t=[],s=[];for(let[o,i]of r.entries())t.push(this.parse(o)),s.push(this.parse(i));return this.createMapNode(e,t,s,r.size)}parseSet(e,r){let t=[];for(let s of r.keys())t.push(this.parse(s));return Ae(e,r.size,t)}parsePlugin(e,r){let t=this.plugins;if(t)for(let s=0,o=t.length;s<o;s++){let i=t[s];if(i.parse.sync&&i.test(r))return F$1(e,i.tag,i.parse.sync(r,this,{id:e}))}}parseStream(e,r){return B$1(e,this.parseSpecialReference(4),[])}parsePromise(e,r){return this.createPromiseConstructorNode(e)}parseObject(e,r){if(Array.isArray(r))return this.parseArray(e,r);if(Ce(r))return this.parseStream(e,r);let t=r.constructor;if(t===E$1)return this.parse(r.replacement);let s=this.parsePlugin(e,r);if(s)return s;switch(t){case Object:return this.parsePlainObject(e,r,!1);case void 0:return this.parsePlainObject(e,r,!0);case Date:return pe(e,r);case RegExp:return me(e,r);case Error:case EvalError:case RangeError:case ReferenceError:case SyntaxError:case TypeError:case URIError:return this.parseError(e,r);case Number:case Boolean:case String:case BigInt:return this.parseBoxed(e,r);case ArrayBuffer:return ge(e,r);case Int8Array:case Int16Array:case Int32Array:case Uint8Array:case Uint16Array:case Uint32Array:case Uint8ClampedArray:case Float32Array:case Float64Array:return this.parseTypedArray(e,r);case DataView:return this.parseDataView(e,r);case Map:return this.parseMap(e,r);case Set:return this.parseSet(e,r);}if(t===Promise||r instanceof Promise)return this.parsePromise(e,r);let o=this.features;if(o&16)switch(t){case BigInt64Array:case BigUint64Array:return this.parseBigIntTypedArray(e,r);}if(o&1&&typeof AggregateError!="undefined"&&(t===AggregateError||r instanceof AggregateError))return this.parseAggregateError(e,r);if(r instanceof Error)return this.parseError(e,r);if(Symbol.iterator in r||Symbol.asyncIterator in r)return this.parsePlainObject(e,r,!!t);throw new p$1(r)}parse(e){try{switch(typeof e){case"boolean":return e?N:b;case"undefined":return ae$1;case"string":return x$1(e);case"number":return ce(e);case"bigint":return fe(e);case"object":{if(e){let r=this.getReference(e);return r.type===0?this.parseObject(r.value,e):r.value}return le}case"symbol":return this.parseWellKnownSymbol(e);case"function":return this.parseFunction(e);default:throw new p$1(e)}}catch(r){throw new j(r)}}};var Q$1=class Q extends g$1{constructor(r){super(r);this.alive=!0;this.pending=0;this.initial=!0;this.buffer=[];this.onParseCallback=r.onParse,this.onErrorCallback=r.onError,this.onDoneCallback=r.onDone;}onParseInternal(r,t){try{this.onParseCallback(r,t);}catch(s){this.onError(s);}}flush(){for(let r=0,t=this.buffer.length;r<t;r++)this.onParseInternal(this.buffer[r],!1);}onParse(r){this.initial?this.buffer.push(r):this.onParseInternal(r,!1);}onError(r){if(this.onErrorCallback)this.onErrorCallback(r);else throw r}onDone(){this.onDoneCallback&&this.onDoneCallback();}pushPendingState(){this.pending++;}popPendingState(){--this.pending<=0&&this.onDone();}parseProperties(r){let t=Object.entries(r),s=[],o=[];for(let a=0,l=t.length;a<l;a++)s.push(d$1(t[a][0])),o.push(this.parse(t[a][1]));let i=Symbol.iterator;return i in r&&(s.push(this.parseWellKnownSymbol(i)),o.push(V$1(this.parseIteratorFactory(),this.parse(U(r))))),i=Symbol.asyncIterator,i in r&&(s.push(this.parseWellKnownSymbol(i)),o.push(D(this.parseAsyncIteratorFactory(),this.parse(ze(r))))),i=Symbol.toStringTag,i in r&&(s.push(this.parseWellKnownSymbol(i)),o.push(x$1(r[i]))),i=Symbol.isConcatSpreadable,i in r&&(s.push(this.parseWellKnownSymbol(i)),o.push(r[i]?N:b)),{k:s,v:o,s:s.length}}parsePromise(r,t){return t.then(s=>{let o=this.parseWithError(s);o&&this.onParse({t:23,i:r,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:[this.parseSpecialReference(2),o],f:void 0,b:void 0,o:void 0}),this.popPendingState();},s=>{if(this.alive){let o=this.parseWithError(s);o&&this.onParse({t:24,i:r,s:void 0,l:void 0,c:void 0,m:void 0,p:void 0,e:void 0,a:[this.parseSpecialReference(3),o],f:void 0,b:void 0,o:void 0});}this.popPendingState();}),this.pushPendingState(),this.createPromiseConstructorNode(r)}parsePlugin(r,t){let s=this.plugins;if(s)for(let o=0,i=s.length;o<i;o++){let a=s[o];if(a.parse.stream&&a.test(t))return F$1(r,a.tag,a.parse.stream(t,this,{id:r}))}}parseStream(r,t){let s=B$1(r,this.parseSpecialReference(4),[]);return this.pushPendingState(),t.on({next:o=>{if(this.alive){let i=this.parseWithError(o);i&&this.onParse(Ie(r,i));}},throw:o=>{if(this.alive){let i=this.parseWithError(o);i&&this.onParse(Re(r,i));}this.popPendingState();},return:o=>{if(this.alive){let i=this.parseWithError(o);i&&this.onParse(Ee(r,i));}this.popPendingState();}}),s}parseWithError(r){try{return this.parse(r)}catch(t){this.onError(t);return}}start(r){let t=this.parseWithError(r);t&&(this.onParseInternal(t,!0),this.initial=!1,this.flush(),this.pending<=0&&this.destroy());}destroy(){this.alive&&(this.onDone(),this.alive=!1);}isAlive(){return this.alive}};var L$1=class L extends Q$1{constructor(){super(...arguments);this.mode="cross";}};function dr(n,e){let r=c(e.plugins),t=new L$1({plugins:r,refs:e.refs,disabledFeatures:e.disabledFeatures,onParse(s,o){let i=new C({plugins:r,features:t.features,scopeId:e.scopeId,markedRefs:t.marked}),a;try{a=i.serializeTop(s);}catch(l){e.onError&&e.onError(l);return}e.onSerialize(a,o);},onError:e.onError,onDone:e.onDone});return t.start(n),()=>{t.destroy();}}var ke=class{constructor(e){this.options=e;this.alive=!0;this.flushed=!1;this.done=!1;this.pending=0;this.cleanups=[];this.refs=new Map;this.keys=new Set;this.ids=0;this.plugins=c(e.plugins);}write(e,r){this.alive&&!this.flushed&&(this.pending++,this.keys.add(e),this.cleanups.push(dr(r,{plugins:this.plugins,scopeId:this.options.scopeId,refs:this.refs,disabledFeatures:this.options.disabledFeatures,onError:this.options.onError,onSerialize:(t,s)=>{this.alive&&this.options.onData(s?this.options.globalIdentifier+'["'+d$1(e)+'"]='+t:t);},onDone:()=>{this.alive&&(this.pending--,this.pending<=0&&this.flushed&&!this.done&&this.options.onDone&&(this.options.onDone(),this.done=!0));}})));}getNextID(){for(;this.keys.has(""+this.ids);)this.ids++;return ""+this.ids}push(e){let r=this.getNextID();return this.write(r,e),r}flush(){this.alive&&(this.flushed=!0,this.pending<=0&&!this.done&&this.options.onDone&&(this.options.onDone(),this.done=!0));}close(){if(this.alive){for(let e=0,r=this.cleanups.length;e<r;e++)this.cleanups[e]();!this.done&&this.options.onDone&&(this.options.onDone(),this.done=!0),this.alive=!1;}}};

function p(e){return {detail:e.detail,bubbles:e.bubbles,cancelable:e.cancelable,composed:e.composed}}var E=Mr({tag:"seroval-plugins/web/CustomEvent",test(e){return typeof CustomEvent=="undefined"?!1:e instanceof CustomEvent},parse:{sync(e,r){return {type:r.parse(e.type),options:r.parse(p(e))}},async async(e,r){return {type:await r.parse(e.type),options:await r.parse(p(e))}},stream(e,r){return {type:r.parse(e.type),options:r.parse(p(e))}}},serialize(e,r){return "new CustomEvent("+r.serialize(e.type)+","+r.serialize(e.options)+")"},deserialize(e,r){return new CustomEvent(r.deserialize(e.type),r.deserialize(e.options))}}),F=E;var I=Mr({tag:"seroval-plugins/web/DOMException",test(e){return typeof DOMException=="undefined"?!1:e instanceof DOMException},parse:{sync(e,r){return {name:r.parse(e.name),message:r.parse(e.message)}},async async(e,r){return {name:await r.parse(e.name),message:await r.parse(e.message)}},stream(e,r){return {name:r.parse(e.name),message:r.parse(e.message)}}},serialize(e,r){return "new DOMException("+r.serialize(e.message)+","+r.serialize(e.name)+")"},deserialize(e,r){return new DOMException(r.deserialize(e.message),r.deserialize(e.name))}}),B=I;function u(e){return {bubbles:e.bubbles,cancelable:e.cancelable,composed:e.composed}}var L=Mr({tag:"seroval-plugins/web/Event",test(e){return typeof Event=="undefined"?!1:e instanceof Event},parse:{sync(e,r){return {type:r.parse(e.type),options:r.parse(u(e))}},async async(e,r){return {type:await r.parse(e.type),options:await r.parse(u(e))}},stream(e,r){return {type:r.parse(e.type),options:r.parse(u(e))}}},serialize(e,r){return "new Event("+r.serialize(e.type)+","+r.serialize(e.options)+")"},deserialize(e,r){return new Event(r.deserialize(e.type),r.deserialize(e.options))}}),O=L;var q=Mr({tag:"seroval-plugins/web/File",test(e){return typeof File=="undefined"?!1:e instanceof File},parse:{async async(e,r){return {name:await r.parse(e.name),options:await r.parse({type:e.type,lastModified:e.lastModified}),buffer:await r.parse(await e.arrayBuffer())}}},serialize(e,r){return "new File(["+r.serialize(e.buffer)+"],"+r.serialize(e.name)+","+r.serialize(e.options)+")"},deserialize(e,r){return new File([r.deserialize(e.buffer)],r.deserialize(e.name),r.deserialize(e.options))}}),d=q;function f(e){let r=[];return e.forEach((s,a)=>{r.push([a,s]);}),r}var n={},H=Mr({tag:"seroval-plugins/web/FormDataFactory",test(e){return e===n},parse:{sync(){},async async(){return await Promise.resolve(void 0)},stream(){}},serialize(e,r){return r.createEffectfulFunction(["e","f","i","s","t"],"f=new FormData;for(i=0,s=e.length;i<s;i++)f.append((t=e[i])[0],t[1]);return f")},deserialize(){return n}}),M=Mr({tag:"seroval-plugins/web/FormData",extends:[d,H],test(e){return typeof FormData=="undefined"?!1:e instanceof FormData},parse:{sync(e,r){return {factory:r.parse(n),entries:r.parse(f(e))}},async async(e,r){return {factory:await r.parse(n),entries:await r.parse(f(e))}},stream(e,r){return {factory:r.parse(n),entries:r.parse(f(e))}}},serialize(e,r){return "("+r.serialize(e.factory)+")("+r.serialize(e.entries)+")"},deserialize(e,r){let s=new FormData,a=r.deserialize(e.entries);for(let t=0,b=a.length;t<b;t++){let c=a[t];s.append(c[0],c[1]);}return s}}),A=M;function m(e){let r=[];return e.forEach((s,a)=>{r.push([a,s]);}),r}var _=Mr({tag:"seroval-plugins/web/Headers",test(e){return typeof Headers=="undefined"?!1:e instanceof Headers},parse:{sync(e,r){return r.parse(m(e))},async async(e,r){return await r.parse(m(e))},stream(e,r){return r.parse(m(e))}},serialize(e,r){return "new Headers("+r.serialize(e)+")"},deserialize(e,r){return new Headers(r.deserialize(e))}}),i=_;var o={},V=Mr({tag:"seroval-plugins/web/ReadableStreamFactory",test(e){return e===o},parse:{sync(){},async async(){return await Promise.resolve(void 0)},stream(){}},serialize(e,r){return r.createFunction(["d"],"new ReadableStream({start:"+r.createEffectfulFunction(["c"],"d.on({next:"+r.createEffectfulFunction(["v"],"c.enqueue(v)")+",throw:"+r.createEffectfulFunction(["v"],"c.error(v)")+",return:"+r.createEffectfulFunction([],"c.close()")+"})")+"})")},deserialize(){return o}});function g(e){let r=M$1(),s=e.getReader();async function a(){try{let t=await s.read();t.done?r.return(t.value):(r.next(t.value),await a());}catch(t){r.throw(t);}}return a().catch(()=>{}),r}var G=Mr({tag:"seroval/plugins/web/ReadableStream",extends:[V],test(e){return typeof ReadableStream=="undefined"?!1:e instanceof ReadableStream},parse:{sync(e,r){return {factory:r.parse(o),stream:r.parse(M$1())}},async async(e,r){return {factory:await r.parse(o),stream:await r.parse(g(e))}},stream(e,r){return {factory:r.parse(o),stream:r.parse(g(e))}}},serialize(e,r){return "("+r.serialize(e.factory)+")("+r.serialize(e.stream)+")"},deserialize(e,r){let s=r.deserialize(e.stream);return new ReadableStream({start(a){s.on({next(t){a.enqueue(t);},throw(t){a.error(t);},return(){a.close();}});}})}}),l=G;function z(e,r){return {body:r,cache:e.cache,credentials:e.credentials,headers:e.headers,integrity:e.integrity,keepalive:e.keepalive,method:e.method,mode:e.mode,redirect:e.redirect,referrer:e.referrer,referrerPolicy:e.referrerPolicy}}var K=Mr({tag:"seroval-plugins/web/Request",extends:[l,i],test(e){return typeof Request=="undefined"?!1:e instanceof Request},parse:{async async(e,r){return {url:await r.parse(e.url),options:await r.parse(z(e,e.body?await e.clone().arrayBuffer():null))}},stream(e,r){return {url:r.parse(e.url),options:r.parse(z(e,e.clone().body))}}},serialize(e,r){return "new Request("+r.serialize(e.url)+","+r.serialize(e.options)+")"},deserialize(e,r){return new Request(r.deserialize(e.url),r.deserialize(e.options))}}),Q=K;function S(e){return {headers:e.headers,status:e.status,statusText:e.statusText}}var X=Mr({tag:"seroval-plugins/web/Response",extends:[l,i],test(e){return typeof Response=="undefined"?!1:e instanceof Response},parse:{async async(e,r){return {body:await r.parse(e.body?await e.clone().arrayBuffer():null),options:await r.parse(S(e))}},stream(e,r){return {body:r.parse(e.clone().body),options:r.parse(S(e))}}},serialize(e,r){return "new Response("+r.serialize(e.body)+","+r.serialize(e.options)+")"},deserialize(e,r){return new Response(r.deserialize(e.body),r.deserialize(e.options))}}),Z=X;var x=Mr({tag:"seroval-plugins/web/URLSearchParams",test(e){return typeof URLSearchParams=="undefined"?!1:e instanceof URLSearchParams},parse:{sync(e,r){return r.parse(e.toString())},async async(e,r){return await r.parse(e.toString())},stream(e,r){return r.parse(e.toString())}},serialize(e,r){return "new URLSearchParams("+r.serialize(e)+")"},deserialize(e,r){return new URLSearchParams(r.deserialize(e))}}),ee=x;var ae=Mr({tag:"seroval-plugins/web/URL",test(e){return typeof URL=="undefined"?!1:e instanceof URL},parse:{sync(e,r){return r.parse(e.href)},async async(e,r){return await r.parse(e.href)},stream(e,r){return r.parse(e.href)}},serialize(e,r){return "new URL("+r.serialize(e)+")"},deserialize(e,r){return new URL(r.deserialize(e))}}),te=ae;

const booleans = ["allowfullscreen", "async", "autofocus", "autoplay", "checked", "controls", "default", "disabled", "formnovalidate", "hidden", "indeterminate", "inert", "ismap", "loop", "multiple", "muted", "nomodule", "novalidate", "open", "playsinline", "readonly", "required", "reversed", "seamless", "selected"];
const BooleanAttributes = /*#__PURE__*/new Set(booleans);
const ChildProperties = /*#__PURE__*/new Set(["innerHTML", "textContent", "innerText", "children"]);
const Aliases = /*#__PURE__*/Object.assign(Object.create(null), {
  className: "class",
  htmlFor: "for"
});

const ES2017FLAG = T.AggregateError
| T.BigIntTypedArray;
const GLOBAL_IDENTIFIER = '_$HY.r';
function createSerializer({
  onData,
  onDone,
  scopeId,
  onError
}) {
  return new ke({
    scopeId,
    plugins: [
    F, B, O,
    A, i, l, Q, Z, ee, te],
    globalIdentifier: GLOBAL_IDENTIFIER,
    disabledFeatures: ES2017FLAG,
    onData,
    onDone,
    onError
  });
}
function getLocalHeaderScript(id) {
  return hr(id) + ';';
}

const VOID_ELEMENTS = /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;
const REPLACE_SCRIPT = `function $df(e,n,o,t){if(n=document.getElementById(e),o=document.getElementById("pl-"+e)){for(;o&&8!==o.nodeType&&o.nodeValue!=="pl-"+e;)t=o.nextSibling,o.remove(),o=t;_$HY.done?o.remove():o.replaceWith(n.content)}n.remove(),_$HY.fe(e)}`;
function renderToStringAsync(code, options = {}) {
  const {
    timeoutMs = 30000
  } = options;
  let timeoutHandle;
  const timeout = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject("renderToString timed out"), timeoutMs);
  });
  return Promise.race([renderToStream(code, options), timeout]).then(html => {
    clearTimeout(timeoutHandle);
    return html;
  });
}
function renderToStream(code, options = {}) {
  let {
    nonce,
    onCompleteShell,
    onCompleteAll,
    renderId,
    noScripts
  } = options;
  let dispose;
  const blockingPromises = [];
  const pushTask = task => {
    if (noScripts) return;
    if (!tasks && !firstFlushed) {
      tasks = getLocalHeaderScript(renderId);
    }
    tasks += task + ";";
    if (!timer && firstFlushed) {
      timer = setTimeout(writeTasks);
    }
  };
  const onDone = () => {
    writeTasks();
    doShell();
    onCompleteAll && onCompleteAll({
      write(v) {
        !completed && buffer.write(v);
      }
    });
    writable && writable.end();
    completed = true;
    if (firstFlushed) dispose();
  };
  const serializer = createSerializer({
    scopeId: options.renderId,
    onData: pushTask,
    onDone,
    onError: options.onError
  });
  const flushEnd = () => {
    if (!registry.size) {
      queue(() => queue(() => serializer.flush()));
    }
  };
  const registry = new Map();
  const writeTasks = () => {
    if (tasks.length && !completed && firstFlushed) {
      buffer.write(`<script${nonce ? ` nonce="${nonce}"` : ""}>${tasks}</script>`);
      tasks = "";
    }
    timer && clearTimeout(timer);
    timer = null;
  };
  let context;
  let writable;
  let tmp = "";
  let tasks = "";
  let firstFlushed = false;
  let completed = false;
  let shellCompleted = false;
  let scriptFlushed = false;
  let timer = null;
  let buffer = {
    write(payload) {
      tmp += payload;
    }
  };
  sharedConfig.context = context = {
    id: renderId || "",
    count: 0,
    async: true,
    resources: {},
    lazy: {},
    suspense: {},
    assets: [],
    nonce,
    block(p) {
      if (!firstFlushed) blockingPromises.push(p);
    },
    replace(id, payloadFn) {
      if (firstFlushed) return;
      const placeholder = `<!--!$${id}-->`;
      const first = html.indexOf(placeholder);
      if (first === -1) return;
      const last = html.indexOf(`<!--!$/${id}-->`, first + placeholder.length);
      html = html.replace(html.slice(first, last + placeholder.length + 1), resolveSSRNode(payloadFn()));
    },
    serialize(id, p, wait) {
      const serverOnly = sharedConfig.context.noHydrate;
      if (!firstFlushed && wait && typeof p === "object" && "then" in p) {
        blockingPromises.push(p);
        !serverOnly && p.then(d => {
          serializer.write(id, d);
        }).catch(e => {
          serializer.write(id, e);
        });
      } else if (!serverOnly) serializer.write(id, p);
    },
    roots: 0,
    nextRoot() {
      return this.renderId + "i-" + this.roots++;
    },
    registerFragment(key) {
      if (!registry.has(key)) {
        let resolve, reject;
        const p = new Promise((r, rej) => (resolve = r, reject = rej));
        registry.set(key, err => queue(() => queue(() => {
          err ? reject(err) : resolve(true);
          queue(flushEnd);
        })));
        serializer.write(key, p);
      }
      return (value, error) => {
        if (registry.has(key)) {
          const resolve = registry.get(key);
          registry.delete(key);
          if (waitForFragments(registry, key)) {
            resolve();
            return;
          }
          if (!completed) {
            if (!firstFlushed) {
              queue(() => html = replacePlaceholder(html, key, value !== undefined ? value : ""));
              resolve(error);
            } else {
              buffer.write(`<template id="${key}">${value !== undefined ? value : " "}</template>`);
              pushTask(`$df("${key}")${!scriptFlushed ? ";" + REPLACE_SCRIPT : ""}`);
              resolve(error);
              scriptFlushed = true;
            }
          }
        }
        return firstFlushed;
      };
    }
  };
  let html = createRoot(d => {
    dispose = d;
    return resolveSSRNode(escape(code()));
  });
  function doShell() {
    if (shellCompleted) return;
    sharedConfig.context = context;
    context.noHydrate = true;
    html = injectAssets(context.assets, html);
    if (tasks.length) html = injectScripts(html, tasks, nonce);
    buffer.write(html);
    tasks = "";
    onCompleteShell && onCompleteShell({
      write(v) {
        !completed && buffer.write(v);
      }
    });
    shellCompleted = true;
  }
  return {
    then(fn) {
      function complete() {
        dispose();
        fn(tmp);
      }
      if (onCompleteAll) {
        let ogComplete = onCompleteAll;
        onCompleteAll = options => {
          ogComplete(options);
          complete();
        };
      } else onCompleteAll = complete;
      queue(flushEnd);
    },
    pipe(w) {
      allSettled(blockingPromises).then(() => {
        setTimeout(() => {
          doShell();
          buffer = writable = w;
          buffer.write(tmp);
          firstFlushed = true;
          if (completed) {
            dispose();
            writable.end();
          } else flushEnd();
        });
      });
    },
    pipeTo(w) {
      return allSettled(blockingPromises).then(() => {
        let resolve;
        const p = new Promise(r => resolve = r);
        setTimeout(() => {
          doShell();
          const encoder = new TextEncoder();
          const writer = w.getWriter();
          writable = {
            end() {
              writer.releaseLock();
              w.close();
              resolve();
            }
          };
          buffer = {
            write(payload) {
              writer.write(encoder.encode(payload));
            }
          };
          buffer.write(tmp);
          firstFlushed = true;
          if (completed) {
            dispose();
            writable.end();
          } else flushEnd();
        });
        return p;
      });
    }
  };
}
function HydrationScript(props) {
  const {
    nonce
  } = sharedConfig.context;
  return ssr(generateHydrationScript({
    nonce,
    ...props
  }));
}
function ssr(t, ...nodes) {
  if (nodes.length) {
    let result = "";
    for (let i = 0; i < nodes.length; i++) {
      result += t[i];
      const node = nodes[i];
      if (node !== undefined) result += resolveSSRNode(node);
    }
    t = result + t[nodes.length];
  }
  return {
    t
  };
}
function ssrClassList(value) {
  if (!value) return "";
  let classKeys = Object.keys(value),
    result = "";
  for (let i = 0, len = classKeys.length; i < len; i++) {
    const key = classKeys[i],
      classValue = !!value[key];
    if (!key || key === "undefined" || !classValue) continue;
    i && (result += " ");
    result += escape(key);
  }
  return result;
}
function ssrStyle(value) {
  if (!value) return "";
  if (typeof value === "string") return escape(value, true);
  let result = "";
  const k = Object.keys(value);
  for (let i = 0; i < k.length; i++) {
    const s = k[i];
    const v = value[s];
    if (v != undefined) {
      if (i) result += ";";
      result += `${s}:${escape(v, true)}`;
    }
  }
  return result;
}
function ssrElement(tag, props, children, needsId) {
  if (props == null) props = {};else if (typeof props === "function") props = props();
  const skipChildren = VOID_ELEMENTS.test(tag);
  const keys = Object.keys(props);
  let result = `<${tag}${needsId ? ssrHydrationKey() : ""} `;
  let classResolved;
  for (let i = 0; i < keys.length; i++) {
    const prop = keys[i];
    if (ChildProperties.has(prop)) {
      if (children === undefined && !skipChildren) children = prop === "innerHTML" ? props[prop] : escape(props[prop]);
      continue;
    }
    const value = props[prop];
    if (prop === "style") {
      result += `style="${ssrStyle(value)}"`;
    } else if (prop === "class" || prop === "className" || prop === "classList") {
      if (classResolved) continue;
      let n;
      result += `class="${escape(((n = props.class) ? n + " " : "") + ((n = props.className) ? n + " " : ""), true) + ssrClassList(props.classList)}"`;
      classResolved = true;
    } else if (BooleanAttributes.has(prop)) {
      if (value) result += prop;else continue;
    } else if (value == undefined || prop === "ref" || prop.slice(0, 2) === "on") {
      continue;
    } else {
      result += `${Aliases[prop] || escape(prop)}="${escape(value, true)}"`;
    }
    if (i !== keys.length - 1) result += " ";
  }
  if (skipChildren) return {
    t: result + "/>"
  };
  if (typeof children === "function") children = children();
  return {
    t: result + `>${resolveSSRNode(children, true)}</${tag}>`
  };
}
function ssrAttribute(key, value, isBoolean) {
  return isBoolean ? value ? " " + key : "" : value != null ? ` ${key}="${value}"` : "";
}
function ssrHydrationKey() {
  const hk = getHydrationKey();
  return hk ? ` data-hk=${hk}` : "";
}
function escape(s, attr) {
  const t = typeof s;
  if (t !== "string") {
    if (!attr && t === "function") return escape(s());
    if (!attr && Array.isArray(s)) {
      for (let i = 0; i < s.length; i++) s[i] = escape(s[i]);
      return s;
    }
    if (attr && t === "boolean") return String(s);
    return s;
  }
  const delim = attr ? '"' : "<";
  const escDelim = attr ? "&quot;" : "&lt;";
  let iDelim = s.indexOf(delim);
  let iAmp = s.indexOf("&");
  if (iDelim < 0 && iAmp < 0) return s;
  let left = 0,
    out = "";
  while (iDelim >= 0 && iAmp >= 0) {
    if (iDelim < iAmp) {
      if (left < iDelim) out += s.substring(left, iDelim);
      out += escDelim;
      left = iDelim + 1;
      iDelim = s.indexOf(delim, left);
    } else {
      if (left < iAmp) out += s.substring(left, iAmp);
      out += "&amp;";
      left = iAmp + 1;
      iAmp = s.indexOf("&", left);
    }
  }
  if (iDelim >= 0) {
    do {
      if (left < iDelim) out += s.substring(left, iDelim);
      out += escDelim;
      left = iDelim + 1;
      iDelim = s.indexOf(delim, left);
    } while (iDelim >= 0);
  } else while (iAmp >= 0) {
    if (left < iAmp) out += s.substring(left, iAmp);
    out += "&amp;";
    left = iAmp + 1;
    iAmp = s.indexOf("&", left);
  }
  return left < s.length ? out + s.substring(left) : out;
}
function resolveSSRNode(node, top) {
  const t = typeof node;
  if (t === "string") return node;
  if (node == null || t === "boolean") return "";
  if (Array.isArray(node)) {
    let prev = {};
    let mapped = "";
    for (let i = 0, len = node.length; i < len; i++) {
      if (!top && typeof prev !== "object" && typeof node[i] !== "object") mapped += `<!--!$-->`;
      mapped += resolveSSRNode(prev = node[i]);
    }
    return mapped;
  }
  if (t === "object") return node.t;
  if (t === "function") return resolveSSRNode(node());
  return String(node);
}
function getHydrationKey() {
  const hydrate = sharedConfig.context;
  return hydrate && !hydrate.noHydrate && sharedConfig.getNextContextId();
}
function useAssets(fn) {
  sharedConfig.context.assets.push(() => resolveSSRNode(fn()));
}
function generateHydrationScript({
  eventNames = ["click", "input"],
  nonce
} = {}) {
  return `<script${nonce ? ` nonce="${nonce}"` : ""}>window._$HY||(e=>{let t=e=>e&&e.hasAttribute&&(e.hasAttribute("data-hk")?e:t(e.host&&e.host.nodeType?e.host:e.parentNode));["${eventNames.join('", "')}"].forEach((o=>document.addEventListener(o,(o=>{let a=o.composedPath&&o.composedPath()[0]||o.target,s=t(a);s&&!e.completed.has(s)&&e.events.push([s,o])}))))})(_$HY={events:[],completed:new WeakSet,r:{},fe(){}});</script><!--xs-->`;
}
function NoHydration(props) {
  sharedConfig.context.noHydrate = true;
  return props.children;
}
function queue(fn) {
  return Promise.resolve().then(fn);
}
function allSettled(promises) {
  let length = promises.length;
  return Promise.allSettled(promises).then(() => {
    if (promises.length !== length) return allSettled(promises);
    return;
  });
}
function injectAssets(assets, html) {
  if (!assets || !assets.length) return html;
  let out = "";
  for (let i = 0, len = assets.length; i < len; i++) out += assets[i]();
  return html.replace(`</head>`, out + `</head>`);
}
function injectScripts(html, scripts, nonce) {
  const tag = `<script${nonce ? ` nonce="${nonce}"` : ""}>${scripts}</script>`;
  const index = html.indexOf("<!--xs-->");
  if (index > -1) {
    return html.slice(0, index) + tag + html.slice(index);
  }
  return html + tag;
}
function waitForFragments(registry, key) {
  for (const k of [...registry.keys()].reverse()) {
    if (key.startsWith(k)) return true;
  }
  return false;
}
function replacePlaceholder(html, key, value) {
  const marker = `<template id="pl-${key}">`;
  const close = `<!--pl-${key}-->`;
  const first = html.indexOf(marker);
  if (first === -1) return html;
  const last = html.indexOf(close, first + marker.length);
  return html.slice(0, first) + value + html.slice(last + close.length);
}

const isServer = true;

function isWrappable(obj) {
  return obj != null && typeof obj === "object" && (Object.getPrototypeOf(obj) === Object.prototype || Array.isArray(obj));
}
function unwrap(item) {
  return item;
}
function setProperty(state, property, value, force) {
  if (!force && state[property] === value) return;
  if (value === undefined) {
    delete state[property];
  } else state[property] = value;
}
function mergeStoreNode(state, value, force) {
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    setProperty(state, key, value[key], force);
  }
}
function updateArray(current, next) {
  if (typeof next === "function") next = next(current);
  if (Array.isArray(next)) {
    if (current === next) return;
    let i = 0,
      len = next.length;
    for (; i < len; i++) {
      const value = next[i];
      if (current[i] !== value) setProperty(current, i, value);
    }
    setProperty(current, "length", len);
  } else mergeStoreNode(current, next);
}
function updatePath(current, path, traversed = []) {
  let part,
    next = current;
  if (path.length > 1) {
    part = path.shift();
    const partType = typeof part,
      isArray = Array.isArray(current);
    if (Array.isArray(part)) {
      for (let i = 0; i < part.length; i++) {
        updatePath(current, [part[i]].concat(path), traversed);
      }
      return;
    } else if (isArray && partType === "function") {
      for (let i = 0; i < current.length; i++) {
        if (part(current[i], i)) updatePath(current, [i].concat(path), traversed);
      }
      return;
    } else if (isArray && partType === "object") {
      const {
        from = 0,
        to = current.length - 1,
        by = 1
      } = part;
      for (let i = from; i <= to; i += by) {
        updatePath(current, [i].concat(path), traversed);
      }
      return;
    } else if (path.length > 1) {
      updatePath(current[part], path, [part].concat(traversed));
      return;
    }
    next = current[part];
    traversed = [part].concat(traversed);
  }
  let value = path[0];
  if (typeof value === "function") {
    value = value(next, traversed);
    if (value === next) return;
  }
  if (part === undefined && value == undefined) return;
  if (part === undefined || isWrappable(next) && isWrappable(value) && !Array.isArray(value)) {
    mergeStoreNode(next, value);
  } else setProperty(current, part, value);
}
function createStore(state) {
  const isArray = Array.isArray(state);
  function setStore(...args) {
    isArray && args.length === 1 ? updateArray(state, args[0]) : updatePath(state, args);
  }
  return [state, setStore];
}
function reconcile(value, options = {}) {
  return state => {
    if (!isWrappable(state) || !isWrappable(value)) return value;
    const targetKeys = Object.keys(value);
    for (let i = 0, len = targetKeys.length; i < len; i++) {
      const key = targetKeys[i];
      setProperty(state, key, value[key]);
    }
    const previousKeys = Object.keys(state);
    for (let i = 0, len = previousKeys.length; i < len; i++) {
      if (value[previousKeys[i]] === undefined) setProperty(state, previousKeys[i], undefined);
    }
    return state;
  };
}

const FETCH_EVENT = "$FETCH";

function getRouteMatches$1(routes, path, method) {
  const segments = path.split("/").filter(Boolean);
  routeLoop:
    for (const route of routes) {
      const matchSegments = route.matchSegments;
      if (segments.length < matchSegments.length || !route.wildcard && segments.length > matchSegments.length) {
        continue;
      }
      for (let index = 0; index < matchSegments.length; index++) {
        const match = matchSegments[index];
        if (!match) {
          continue;
        }
        if (segments[index] !== match) {
          continue routeLoop;
        }
      }
      const handler = route[method];
      if (handler === "skip" || handler === void 0) {
        return;
      }
      const params = {};
      for (const { type, name, index } of route.params) {
        if (type === ":") {
          params[name] = segments[index];
        } else {
          params[name] = segments.slice(index).join("/");
        }
      }
      return { handler, params };
    }
}

let apiRoutes$1;
const registerApiRoutes = (routes) => {
  apiRoutes$1 = routes;
};
async function internalFetch(route, init, env = {}, locals = {}) {
  if (route.startsWith("http")) {
    return await fetch(route, init);
  }
  let url = new URL(route, "http://internal");
  const request = new Request(url.href, init);
  const handler = getRouteMatches$1(apiRoutes$1, url.pathname, request.method.toUpperCase());
  if (!handler) {
    throw new Error(`No handler found for ${request.method} ${request.url}`);
  }
  let apiEvent = Object.freeze({
    request,
    params: handler.params,
    clientAddress: "127.0.0.1",
    env,
    locals,
    $type: FETCH_EVENT,
    fetch: internalFetch
  });
  const response = await handler.handler(apiEvent);
  return response;
}

const XSolidStartLocationHeader = "x-solidstart-location";
const LocationHeader = "Location";
const ContentTypeHeader = "content-type";
const XSolidStartResponseTypeHeader = "x-solidstart-response-type";
const XSolidStartContentTypeHeader = "x-solidstart-content-type";
const XSolidStartOrigin = "x-solidstart-origin";
const JSONResponseType = "application/json";
function redirect(url, init = 302) {
  let responseInit = init;
  if (typeof responseInit === "number") {
    responseInit = { status: responseInit };
  } else if (typeof responseInit.status === "undefined") {
    responseInit.status = 302;
  }
  if (url === "") {
    url = "/";
  }
  let headers = new Headers(responseInit.headers);
  headers.set(LocationHeader, url);
  const response = new Response(null, {
    ...responseInit,
    headers
  });
  return response;
}
const redirectStatusCodes = /* @__PURE__ */ new Set([204, 301, 302, 303, 307, 308]);
function isRedirectResponse(response) {
  return response && response instanceof Response && redirectStatusCodes.has(response.status);
}
let ResponseError$1 = class ResponseError extends Error {
  status;
  headers;
  name = "ResponseError";
  ok;
  statusText;
  redirected;
  url;
  constructor(response) {
    let message = JSON.stringify({
      $type: "response",
      status: response.status,
      message: response.statusText,
      headers: [...response.headers.entries()]
    });
    super(message);
    this.status = response.status;
    this.headers = new Map([...response.headers.entries()]);
    this.url = response.url;
    this.ok = response.ok;
    this.statusText = response.statusText;
    this.redirected = response.redirected;
    this.bodyUsed = false;
    this.type = response.type;
    this.response = () => response;
  }
  response;
  type;
  clone() {
    return this.response();
  }
  get body() {
    return this.response().body;
  }
  bodyUsed;
  async arrayBuffer() {
    return await this.response().arrayBuffer();
  }
  async blob() {
    return await this.response().blob();
  }
  async formData() {
    return await this.response().formData();
  }
  async text() {
    return await this.response().text();
  }
  async json() {
    return await this.response().json();
  }
};

const api = [
  {
    GET: "skip",
    path: "/"
  }
];
function expandOptionals$1(pattern) {
  let match = /(\/?\:[^\/]+)\?/.exec(pattern);
  if (!match)
    return [pattern];
  let prefix = pattern.slice(0, match.index);
  let suffix = pattern.slice(match.index + match[0].length);
  const prefixes = [prefix, prefix += match[1]];
  while (match = /^(\/\:[^\/]+)\?/.exec(suffix)) {
    prefixes.push(prefix += match[1]);
    suffix = suffix.slice(match[0].length);
  }
  return expandOptionals$1(suffix).reduce(
    (results, expansion) => [...results, ...prefixes.map((p) => p + expansion)],
    []
  );
}
function routeToMatchRoute(route) {
  const segments = route.path.split("/").filter(Boolean);
  const params = [];
  const matchSegments = [];
  let score = 0;
  let wildcard = false;
  for (const [index, segment] of segments.entries()) {
    if (segment[0] === ":") {
      const name = segment.slice(1);
      score += 3;
      params.push({
        type: ":",
        name,
        index
      });
      matchSegments.push(null);
    } else if (segment[0] === "*") {
      score -= 1;
      params.push({
        type: "*",
        name: segment.slice(1),
        index
      });
      wildcard = true;
    } else {
      score += 4;
      matchSegments.push(segment);
    }
  }
  return {
    ...route,
    score,
    params,
    matchSegments,
    wildcard
  };
}
const allRoutes = api.flatMap((route) => {
  const paths = expandOptionals$1(route.path);
  return paths.map((path) => ({ ...route, path }));
}).map(routeToMatchRoute).sort((a, b) => b.score - a.score);
registerApiRoutes(allRoutes);
function getApiHandler(url, method) {
  return getRouteMatches$1(allRoutes, url.pathname, method.toUpperCase());
}

const apiRoutes = ({ forward }) => {
  return async (event) => {
    let apiHandler = getApiHandler(new URL(event.request.url), event.request.method);
    if (apiHandler) {
      let apiEvent = Object.freeze({
        request: event.request,
        clientAddress: event.clientAddress,
        locals: event.locals,
        params: apiHandler.params,
        env: event.env,
        $type: FETCH_EVENT,
        fetch: internalFetch
      });
      try {
        return await apiHandler.handler(apiEvent);
      } catch (error) {
        if (error instanceof Response) {
          return error;
        }
        return new Response(JSON.stringify(error), {
          status: 500
        });
      }
    }
    return await forward(event);
  };
};
function normalizeIntegration(integration) {
    if (!integration) {
        return {
            signal: createSignal({ value: "" })
        };
    }
    else if (Array.isArray(integration)) {
        return {
            signal: integration
        };
    }
    return integration;
}
function staticIntegration(obj) {
    return {
        signal: [() => obj, next => Object.assign(obj, next)]
    };
}

function createBeforeLeave() {
    let listeners = new Set();
    function subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
    let ignore = false;
    function confirm(to, options) {
        if (ignore)
            return !(ignore = false);
        const e = {
            to,
            options,
            defaultPrevented: false,
            preventDefault: () => (e.defaultPrevented = true)
        };
        for (const l of listeners)
            l.listener({
                ...e,
                from: l.location,
                retry: (force) => {
                    force && (ignore = true);
                    l.navigate(to, options);
                }
            });
        return !e.defaultPrevented;
    }
    return {
        subscribe,
        confirm
    };
}

const hasSchemeRegex = /^(?:[a-z0-9]+:)?\/\//i;
const trimPathRegex = /^\/+|(\/)\/+$/g;
function normalizePath(path, omitSlash = false) {
    const s = path.replace(trimPathRegex, "$1");
    return s ? (omitSlash || /^[?#]/.test(s) ? s : "/" + s) : "";
}
function resolvePath(base, path, from) {
    if (hasSchemeRegex.test(path)) {
        return undefined;
    }
    const basePath = normalizePath(base);
    const fromPath = from && normalizePath(from);
    let result = "";
    if (!fromPath || path.startsWith("/")) {
        result = basePath;
    }
    else if (fromPath.toLowerCase().indexOf(basePath.toLowerCase()) !== 0) {
        result = basePath + fromPath;
    }
    else {
        result = fromPath;
    }
    return (result || "/") + normalizePath(path, !result);
}
function invariant(value, message) {
    if (value == null) {
        throw new Error(message);
    }
    return value;
}
function joinPaths(from, to) {
    return normalizePath(from).replace(/\/*(\*.*)?$/g, "") + normalizePath(to);
}
function extractSearchParams(url) {
    const params = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}
function createMatcher(path, partial, matchFilters) {
    const [pattern, splat] = path.split("/*", 2);
    const segments = pattern.split("/").filter(Boolean);
    const len = segments.length;
    return (location) => {
        const locSegments = location.split("/").filter(Boolean);
        const lenDiff = locSegments.length - len;
        if (lenDiff < 0 || (lenDiff > 0 && splat === undefined && !partial)) {
            return null;
        }
        const match = {
            path: len ? "" : "/",
            params: {}
        };
        const matchFilter = (s) => matchFilters === undefined ? undefined : matchFilters[s];
        for (let i = 0; i < len; i++) {
            const segment = segments[i];
            const locSegment = locSegments[i];
            const dynamic = segment[0] === ":";
            const key = dynamic ? segment.slice(1) : segment;
            if (dynamic && matchSegment(locSegment, matchFilter(key))) {
                match.params[key] = locSegment;
            }
            else if (dynamic || !matchSegment(locSegment, segment)) {
                return null;
            }
            match.path += `/${locSegment}`;
        }
        if (splat) {
            const remainder = lenDiff ? locSegments.slice(-lenDiff).join("/") : "";
            if (matchSegment(remainder, matchFilter(splat))) {
                match.params[splat] = remainder;
            }
            else {
                return null;
            }
        }
        return match;
    };
}
function matchSegment(input, filter) {
    const isEqual = (s) => s.localeCompare(input, undefined, { sensitivity: "base" }) === 0;
    if (filter === undefined) {
        return true;
    }
    else if (typeof filter === "string") {
        return isEqual(filter);
    }
    else if (typeof filter === "function") {
        return filter(input);
    }
    else if (Array.isArray(filter)) {
        return filter.some(isEqual);
    }
    else if (filter instanceof RegExp) {
        return filter.test(input);
    }
    return false;
}
function scoreRoute(route) {
    const [pattern, splat] = route.pattern.split("/*", 2);
    const segments = pattern.split("/").filter(Boolean);
    return segments.reduce((score, segment) => score + (segment.startsWith(":") ? 2 : 3), segments.length - (splat === undefined ? 0 : 1));
}
function createMemoObject(fn) {
    const map = new Map();
    const owner = getOwner();
    return new Proxy({}, {
        get(_, property) {
            if (!map.has(property)) {
                runWithOwner(owner, () => map.set(property, createMemo(() => fn()[property])));
            }
            return map.get(property)();
        },
        getOwnPropertyDescriptor() {
            return {
                enumerable: true,
                configurable: true
            };
        },
        ownKeys() {
            return Reflect.ownKeys(fn());
        }
    });
}
function expandOptionals(pattern) {
    let match = /(\/?\:[^\/]+)\?/.exec(pattern);
    if (!match)
        return [pattern];
    let prefix = pattern.slice(0, match.index);
    let suffix = pattern.slice(match.index + match[0].length);
    const prefixes = [prefix, (prefix += match[1])];
    // This section handles adjacent optional params. We don't actually want all permuations since
    // that will lead to equivalent routes which have the same number of params. For example
    // `/:a?/:b?/:c`? only has the unique expansion: `/`, `/:a`, `/:a/:b`, `/:a/:b/:c` and we can
    // discard `/:b`, `/:c`, `/:b/:c` by building them up in order and not recursing. This also helps
    // ensure predictability where earlier params have precidence.
    while ((match = /^(\/\:[^\/]+)\?/.exec(suffix))) {
        prefixes.push((prefix += match[1]));
        suffix = suffix.slice(match[0].length);
    }
    return expandOptionals(suffix).reduce((results, expansion) => [...results, ...prefixes.map(p => p + expansion)], []);
}

const MAX_REDIRECTS = 100;
const RouterContextObj = createContext();
const RouteContextObj = createContext();
const useRouter = () => invariant(useContext(RouterContextObj), "Make sure your app is wrapped in a <Router />");
let TempRoute;
const useRoute = () => TempRoute || useContext(RouteContextObj) || useRouter().base;
const useNavigate$1 = () => useRouter().navigatorFactory();
const useRouteData = () => useRoute().data;
function createRoutes(routeDef, base = "", fallback) {
    const { component, data, children } = routeDef;
    const isLeaf = !children || (Array.isArray(children) && !children.length);
    const shared = {
        key: routeDef,
        element: component
            ? () => createComponent(component, {})
            : () => {
                const { element } = routeDef;
                return element === undefined && fallback
                    ? createComponent(fallback, {})
                    : element;
            },
        preload: routeDef.component
            ? component.preload
            : routeDef.preload,
        data
    };
    return asArray(routeDef.path).reduce((acc, path) => {
        for (const originalPath of expandOptionals(path)) {
            const path = joinPaths(base, originalPath);
            const pattern = isLeaf ? path : path.split("/*", 1)[0];
            acc.push({
                ...shared,
                originalPath,
                pattern,
                matcher: createMatcher(pattern, !isLeaf, routeDef.matchFilters)
            });
        }
        return acc;
    }, []);
}
function createBranch(routes, index = 0) {
    return {
        routes,
        score: scoreRoute(routes[routes.length - 1]) * 10000 - index,
        matcher(location) {
            const matches = [];
            for (let i = routes.length - 1; i >= 0; i--) {
                const route = routes[i];
                const match = route.matcher(location);
                if (!match) {
                    return null;
                }
                matches.unshift({
                    ...match,
                    route
                });
            }
            return matches;
        }
    };
}
function asArray(value) {
    return Array.isArray(value) ? value : [value];
}
function createBranches(routeDef, base = "", fallback, stack = [], branches = []) {
    const routeDefs = asArray(routeDef);
    for (let i = 0, len = routeDefs.length; i < len; i++) {
        const def = routeDefs[i];
        if (def && typeof def === "object" && def.hasOwnProperty("path")) {
            const routes = createRoutes(def, base, fallback);
            for (const route of routes) {
                stack.push(route);
                const isEmptyArray = Array.isArray(def.children) && def.children.length === 0;
                if (def.children && !isEmptyArray) {
                    createBranches(def.children, route.pattern, fallback, stack, branches);
                }
                else {
                    const branch = createBranch([...stack], branches.length);
                    branches.push(branch);
                }
                stack.pop();
            }
        }
    }
    // Stack will be empty on final return
    return stack.length ? branches : branches.sort((a, b) => b.score - a.score);
}
function getRouteMatches(branches, location) {
    for (let i = 0, len = branches.length; i < len; i++) {
        const match = branches[i].matcher(location);
        if (match) {
            return match;
        }
    }
    return [];
}
function createLocation(path, state) {
    const origin = new URL("http://sar");
    const url = createMemo(prev => {
        const path_ = path();
        try {
            return new URL(path_, origin);
        }
        catch (err) {
            console.error(`Invalid path ${path_}`);
            return prev;
        }
    }, origin);
    const pathname = createMemo(() => url().pathname);
    const search = createMemo(() => url().search, true);
    const hash = createMemo(() => url().hash);
    const key = createMemo(() => "");
    return {
        get pathname() {
            return pathname();
        },
        get search() {
            return search();
        },
        get hash() {
            return hash();
        },
        get state() {
            return state();
        },
        get key() {
            return key();
        },
        query: createMemoObject(on(search, () => extractSearchParams(url())))
    };
}
function createRouterContext(integration, base = "", data, out) {
    const { signal: [source, setSource], utils = {} } = normalizeIntegration(integration);
    const parsePath = utils.parsePath || (p => p);
    const renderPath = utils.renderPath || (p => p);
    const beforeLeave = utils.beforeLeave || createBeforeLeave();
    const basePath = resolvePath("", base);
    const output = out
        ? Object.assign(out, {
            matches: [],
            url: undefined
        })
        : undefined;
    if (basePath === undefined) {
        throw new Error(`${basePath} is not a valid base path`);
    }
    else if (basePath && !source().value) {
        setSource({ value: basePath, replace: true, scroll: false });
    }
    const [isRouting, setIsRouting] = createSignal(false);
    const start = async (callback) => {
        setIsRouting(true);
        try {
            await startTransition(callback);
        }
        finally {
            setIsRouting(false);
        }
    };
    const [reference, setReference] = createSignal(source().value);
    const [state, setState] = createSignal(source().state);
    const location = createLocation(reference, state);
    const referrers = [];
    const baseRoute = {
        pattern: basePath,
        params: {},
        path: () => basePath,
        outlet: () => null,
        resolvePath(to) {
            return resolvePath(basePath, to);
        }
    };
    if (data) {
        try {
            TempRoute = baseRoute;
            baseRoute.data = data({
                data: undefined,
                params: {},
                location,
                navigate: navigatorFactory(baseRoute)
            });
        }
        finally {
            TempRoute = undefined;
        }
    }
    function navigateFromRoute(route, to, options) {
        // Untrack in case someone navigates in an effect - don't want to track `reference` or route paths
        untrack(() => {
            if (typeof to === "number") {
                if (!to) ;
                else if (utils.go) {
                    beforeLeave.confirm(to, options) && utils.go(to);
                }
                else {
                    console.warn("Router integration does not support relative routing");
                }
                return;
            }
            const { replace, resolve, scroll, state: nextState } = {
                replace: false,
                resolve: true,
                scroll: true,
                ...options
            };
            const resolvedTo = resolve ? route.resolvePath(to) : resolvePath("", to);
            if (resolvedTo === undefined) {
                throw new Error(`Path '${to}' is not a routable path`);
            }
            else if (referrers.length >= MAX_REDIRECTS) {
                throw new Error("Too many redirects");
            }
            const current = reference();
            if (resolvedTo !== current || nextState !== state()) {
                {
                    if (output) {
                        output.url = resolvedTo;
                    }
                    setSource({ value: resolvedTo, replace, scroll, state: nextState });
                }
            }
        });
    }
    function navigatorFactory(route) {
        // Workaround for vite issue (https://github.com/vitejs/vite/issues/3803)
        route = route || useContext(RouteContextObj) || baseRoute;
        return (to, options) => navigateFromRoute(route, to, options);
    }
    createRenderEffect(() => {
        const { value, state } = source();
        // Untrack this whole block so `start` doesn't cause Solid's Listener to be preserved
        untrack(() => {
            if (value !== reference()) {
                start(() => {
                    setReference(value);
                    setState(state);
                });
            }
        });
    });
    return {
        base: baseRoute,
        out: output,
        location,
        isRouting,
        renderPath,
        parsePath,
        navigatorFactory,
        beforeLeave
    };
}
function createRouteContext(router, parent, child, match, params) {
    const { base, location, navigatorFactory } = router;
    const { pattern, element: outlet, preload, data } = match().route;
    const path = createMemo(() => match().path);
    preload && preload();
    const route = {
        parent,
        pattern,
        get child() {
            return child();
        },
        path,
        params,
        data: parent.data,
        outlet,
        resolvePath(to) {
            return resolvePath(base.path(), to, path());
        }
    };
    if (data) {
        try {
            TempRoute = route;
            route.data = data({ data: parent.data, params, location, navigate: navigatorFactory(route) });
        }
        finally {
            TempRoute = undefined;
        }
    }
    return route;
}

const Router = (props) => {
  const {
    source,
    url,
    base,
    data,
    out
  } = props;
  const integration = source || (staticIntegration({
    value: url || ""
  }) );
  const routerState = createRouterContext(integration, base, data, out);
  return createComponent(RouterContextObj.Provider, {
    value: routerState,
    get children() {
      return props.children;
    }
  });
};
const Routes$1 = (props) => {
  const router = useRouter();
  const parentRoute = useRoute();
  const routeDefs = children(() => props.children);
  const branches = createMemo(() => createBranches(routeDefs(), joinPaths(parentRoute.pattern, props.base || ""), Outlet));
  const matches = createMemo(() => getRouteMatches(branches(), router.location.pathname));
  const params = createMemoObject(() => {
    const m = matches();
    const params2 = {};
    for (let i = 0; i < m.length; i++) {
      Object.assign(params2, m[i].params);
    }
    return params2;
  });
  if (router.out) {
    router.out.matches.push(matches().map(({
      route,
      path,
      params: params2
    }) => ({
      originalPath: route.originalPath,
      pattern: route.pattern,
      path,
      params: params2
    })));
  }
  const disposers = [];
  let root;
  const routeStates = createMemo(on(matches, (nextMatches, prevMatches, prev) => {
    let equal = prevMatches && nextMatches.length === prevMatches.length;
    const next = [];
    for (let i = 0, len = nextMatches.length; i < len; i++) {
      const prevMatch = prevMatches && prevMatches[i];
      const nextMatch = nextMatches[i];
      if (prev && prevMatch && nextMatch.route.key === prevMatch.route.key) {
        next[i] = prev[i];
      } else {
        equal = false;
        if (disposers[i]) {
          disposers[i]();
        }
        createRoot((dispose) => {
          disposers[i] = dispose;
          next[i] = createRouteContext(router, next[i - 1] || parentRoute, () => routeStates()[i + 1], () => matches()[i], params);
        });
      }
    }
    disposers.splice(nextMatches.length).forEach((dispose) => dispose());
    if (prev && equal) {
      return prev;
    }
    root = next[0];
    return next;
  }));
  return createComponent(Show, {
    get when() {
      return routeStates() && root;
    },
    keyed: true,
    children: (route) => createComponent(RouteContextObj.Provider, {
      value: route,
      get children() {
        return route.outlet();
      }
    })
  });
};
const Outlet = () => {
  const route = useRoute();
  return createComponent(Show, {
    get when() {
      return route.child;
    },
    keyed: true,
    children: (child) => createComponent(RouteContextObj.Provider, {
      value: child,
      get children() {
        return child.outlet();
      }
    })
  });
};

class ServerError extends Error {
  status;
  constructor(message, {
    status,
    stack
  } = {}) {
    super(message);
    this.name = "ServerError";
    this.status = status || 400;
    if (stack) {
      this.stack = stack;
    }
  }
}
class FormError extends ServerError {
  formError;
  fields;
  fieldErrors;
  constructor(message, {
    fieldErrors = {},
    form,
    fields,
    stack
  } = {}) {
    super(message, {
      stack
    });
    this.formError = message;
    this.name = "FormError";
    this.fields = fields || Object.fromEntries(typeof form !== "undefined" ? form.entries() : []) || {};
    this.fieldErrors = fieldErrors;
  }
}

const ServerContext = createContext({});

const Routes = Routes$1;
const useNavigate = useNavigate$1;
const promises = /* @__PURE__ */ new Map();
function createRouteData(fetcher, options = {}) {
  const navigate = useNavigate();
  const pageEvent = useContext(ServerContext);
  function handleResponse(response) {
    if (isRedirectResponse(response)) {
      startTransition(() => {
        let url = response.headers.get(LocationHeader);
        if (url && url.startsWith("/")) {
          navigate(url, {
            replace: true
          });
        }
      });
      if (pageEvent) {
        pageEvent.setStatusCode(response.status);
        response.headers.forEach((head, value) => {
          pageEvent.responseHeaders.set(value, head);
        });
      }
    }
  }
  const resourceFetcher = async (key) => {
    try {
      let event = pageEvent;
      if (isServer && pageEvent) {
        event = Object.freeze({
          request: pageEvent.request,
          env: pageEvent.env,
          clientAddress: pageEvent.clientAddress,
          locals: pageEvent.locals,
          $type: FETCH_EVENT,
          fetch: pageEvent.fetch
        });
      }
      let response = await fetcher.call(event, key, event);
      if (response instanceof Response) {
        if (isServer) {
          handleResponse(response);
        }
      }
      return response;
    } catch (e) {
      if (e instanceof Response) {
        {
          handleResponse(e);
        }
        return e;
      }
      throw e;
    }
  };
  function dedupe(fetcher2) {
    return (key, info) => {
      if (info.refetching && info.refetching !== true && !partialMatch(key, info.refetching) && info.value) {
        return info.value;
      }
      if (key == true)
        return fetcher2(key, info);
      let promise = promises.get(key);
      if (promise)
        return promise;
      promise = fetcher2(key, info);
      promises.set(key, promise);
      return promise.finally(() => promises.delete(key));
    };
  }
  const [resource, {
    refetch
  }] = createResource(options.key || true, dedupe(resourceFetcher), {
    storage: (init) => createDeepSignal(init, options.reconcileOptions),
    ...options
  });
  return resource;
}
function createDeepSignal(value, options) {
  const [store, setStore] = createStore({
    value
  });
  return [() => store.value, (v) => {
    const unwrapped = untrack(() => unwrap(store.value));
    typeof v === "function" && (v = v(unwrapped));
    setStore("value", reconcile(v, options));
    return store.value;
  }];
}
function partialMatch(a, b) {
  return partialDeepEqual(ensureQueryKeyArray(a), ensureQueryKeyArray(b));
}
function ensureQueryKeyArray(value) {
  return Array.isArray(value) ? value : [value];
}
function partialDeepEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (a.length && !b.length)
    return false;
  if (a && b && typeof a === "object" && typeof b === "object") {
    return !Object.keys(b).some((key) => !partialDeepEqual(a[key], b[key]));
  }
  return false;
}

const server$ = (_fn) => {
  throw new Error("Should be compiled away");
};
async function parseRequest(event) {
  let request = event.request;
  let contentType = request.headers.get(ContentTypeHeader);
  let name = new URL(request.url).pathname, args = [];
  if (contentType) {
    if (contentType === JSONResponseType) {
      let text = await request.text();
      try {
        args = JSON.parse(text, (key, value) => {
          if (!value) {
            return value;
          }
          if (value.$type === "headers") {
            let headers = new Headers();
            request.headers.forEach((value2, key2) => headers.set(key2, value2));
            value.values.forEach(([key2, value2]) => headers.set(key2, value2));
            return headers;
          }
          if (value.$type === "request") {
            return new Request(value.url, {
              method: value.method,
              headers: value.headers
            });
          }
          return value;
        });
      } catch (e) {
        throw new Error(`Error parsing request body: ${text}`);
      }
    } else if (contentType.includes("form")) {
      let formData = await request.clone().formData();
      args = [formData, event];
    }
  }
  return [name, args];
}
function respondWith(request, data, responseType) {
  if (data instanceof ResponseError$1) {
    data = data.clone();
  }
  if (data instanceof Response) {
    if (isRedirectResponse(data) && request.headers.get(XSolidStartOrigin) === "client") {
      let headers = new Headers(data.headers);
      headers.set(XSolidStartOrigin, "server");
      headers.set(XSolidStartLocationHeader, data.headers.get(LocationHeader));
      headers.set(XSolidStartResponseTypeHeader, responseType);
      headers.set(XSolidStartContentTypeHeader, "response");
      return new Response(null, {
        status: 204,
        statusText: "Redirected",
        headers
      });
    } else if (data.status === 101) {
      return data;
    } else {
      let headers = new Headers(data.headers);
      headers.set(XSolidStartOrigin, "server");
      headers.set(XSolidStartResponseTypeHeader, responseType);
      headers.set(XSolidStartContentTypeHeader, "response");
      return new Response(data.body, {
        status: data.status,
        statusText: data.statusText,
        headers
      });
    }
  } else if (data instanceof FormError) {
    return new Response(
      JSON.stringify({
        error: {
          message: data.message,
          stack: "",
          formError: data.formError,
          fields: data.fields,
          fieldErrors: data.fieldErrors
        }
      }),
      {
        status: 400,
        headers: {
          [XSolidStartResponseTypeHeader]: responseType,
          [XSolidStartContentTypeHeader]: "form-error"
        }
      }
    );
  } else if (data instanceof ServerError) {
    return new Response(
      JSON.stringify({
        error: {
          message: data.message,
          stack: ""
        }
      }),
      {
        status: data.status,
        headers: {
          [XSolidStartResponseTypeHeader]: responseType,
          [XSolidStartContentTypeHeader]: "server-error"
        }
      }
    );
  } else if (data instanceof Error) {
    console.error(data);
    return new Response(
      JSON.stringify({
        error: {
          message: "Internal Server Error",
          stack: "",
          status: data.status
        }
      }),
      {
        status: data.status || 500,
        headers: {
          [XSolidStartResponseTypeHeader]: responseType,
          [XSolidStartContentTypeHeader]: "error"
        }
      }
    );
  } else if (typeof data === "object" || typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        [ContentTypeHeader]: "application/json",
        [XSolidStartResponseTypeHeader]: responseType,
        [XSolidStartContentTypeHeader]: "json"
      }
    });
  }
  return new Response("null", {
    status: 200,
    headers: {
      [ContentTypeHeader]: "application/json",
      [XSolidStartContentTypeHeader]: "json",
      [XSolidStartResponseTypeHeader]: responseType
    }
  });
}
async function handleServerRequest(event) {
  const url = new URL(event.request.url);
  if (server$.hasHandler(url.pathname)) {
    try {
      let [name, args] = await parseRequest(event);
      let handler = server$.getHandler(name);
      if (!handler) {
        throw {
          status: 404,
          message: "Handler Not Found for " + name
        };
      }
      const data = await handler.call(event, ...Array.isArray(args) ? args : [args]);
      return respondWith(event.request, data, "return");
    } catch (error) {
      return respondWith(event.request, error, "throw");
    }
  }
  return null;
}
const handlers = /* @__PURE__ */ new Map();
server$.createHandler = (_fn, hash, serverResource) => {
  let fn = function(...args) {
    let ctx;
    if (typeof this === "object") {
      ctx = this;
    } else if (sharedConfig.context && sharedConfig.context.requestContext) {
      ctx = sharedConfig.context.requestContext;
    } else {
      ctx = {
        request: new URL(hash, "http://localhost:3000").href,
        responseHeaders: new Headers()
      };
    }
    const execute = async () => {
      try {
        return serverResource ? _fn.call(ctx, args[0], ctx) : _fn.call(ctx, ...args);
      } catch (e) {
        if (e instanceof Error && /[A-Za-z]+ is not defined/.test(e.message)) {
          const error = new Error(
            e.message + "\n You probably are using a variable defined in a closure in your server function."
          );
          error.stack = e.stack;
          throw error;
        }
        throw e;
      }
    };
    return execute();
  };
  fn.url = hash;
  fn.action = function(...args) {
    return fn.call(this, ...args);
  };
  return fn;
};
server$.registerHandler = function(route, handler) {
  handlers.set(route, handler);
};
server$.getHandler = function(route) {
  return handlers.get(route);
};
server$.hasHandler = function(route) {
  return handlers.has(route);
};
server$.fetch = internalFetch;

const inlineServerFunctions = ({ forward }) => {
  return async (event) => {
    const url = new URL(event.request.url);
    if (server$.hasHandler(url.pathname)) {
      let contentType = event.request.headers.get(ContentTypeHeader);
      let origin = event.request.headers.get(XSolidStartOrigin);
      let formRequestBody;
      if (contentType != null && contentType.includes("form") && !(origin != null && origin.includes("client"))) {
        let [read1, read2] = event.request.body.tee();
        formRequestBody = new Request(event.request.url, {
          body: read2,
          headers: event.request.headers,
          method: event.request.method,
          duplex: "half"
        });
        event.request = new Request(event.request.url, {
          body: read1,
          headers: event.request.headers,
          method: event.request.method,
          duplex: "half"
        });
      }
      let serverFunctionEvent = Object.freeze({
        request: event.request,
        clientAddress: event.clientAddress,
        locals: event.locals,
        fetch: internalFetch,
        $type: FETCH_EVENT,
        env: event.env
      });
      const serverResponse = await handleServerRequest(serverFunctionEvent);
      let responseContentType = serverResponse.headers.get(XSolidStartContentTypeHeader);
      if (formRequestBody && responseContentType !== null && responseContentType.includes("error")) {
        const formData = await formRequestBody.formData();
        let entries = [...formData.entries()];
        return new Response(null, {
          status: 302,
          headers: {
            Location: new URL(event.request.headers.get("referer") || "").pathname + "?form=" + encodeURIComponent(
              JSON.stringify({
                url: url.pathname,
                entries,
                ...await serverResponse.json()
              })
            )
          }
        });
      }
      return serverResponse;
    }
    const response = await forward(event);
    return response;
  };
};

function renderAsync(fn, options) {
  return () => apiRoutes({
    forward: inlineServerFunctions({
      async forward(event) {
        let pageEvent = createPageEvent(event);
        let markup = await renderToStringAsync(() => fn(pageEvent), options);
        if (pageEvent.routerContext && pageEvent.routerContext.url) {
          return redirect(pageEvent.routerContext.url, {
            headers: pageEvent.responseHeaders
          });
        }
        markup = handleIslandsRouting(pageEvent, markup);
        return new Response(markup, {
          status: pageEvent.getStatusCode(),
          headers: pageEvent.responseHeaders
        });
      }
    })
  });
}
function createPageEvent(event) {
  let responseHeaders = new Headers({
    "Content-Type": "text/html"
  });
  const prevPath = event.request.headers.get("x-solid-referrer");
  let statusCode = 200;
  function setStatusCode(code) {
    statusCode = code;
  }
  function getStatusCode() {
    return statusCode;
  }
  const pageEvent = Object.freeze({
    request: event.request,
    prevUrl: prevPath || "",
    routerContext: {},
    tags: [],
    env: event.env,
    clientAddress: event.clientAddress,
    locals: event.locals,
    $type: FETCH_EVENT,
    responseHeaders,
    setStatusCode,
    getStatusCode,
    fetch: internalFetch
  });
  return pageEvent;
}
function handleIslandsRouting(pageEvent, markup) {
  return markup;
}

const MetaContext = createContext();
const cascadingTags = ["title", "meta"];
const titleTagProperties = [];
const metaTagProperties = (
  // https://html.spec.whatwg.org/multipage/semantics.html#the-meta-element
  ["name", "http-equiv", "content", "charset", "media"].concat(["property"])
);
const getTagKey = (tag, properties) => {
  const tagProps = Object.fromEntries(Object.entries(tag.props).filter(([k]) => properties.includes(k)).sort());
  if (Object.hasOwn(tagProps, "name") || Object.hasOwn(tagProps, "property")) {
    tagProps.name = tagProps.name || tagProps.property;
    delete tagProps.property;
  }
  return tag.tag + JSON.stringify(tagProps);
};
const MetaProvider = (props) => {
  const cascadedTagInstances = /* @__PURE__ */ new Map();
  const actions = {
    addClientTag: (tag) => {
      if (cascadingTags.indexOf(tag.tag) !== -1) {
        const properties = tag.tag === "title" ? titleTagProperties : metaTagProperties;
        const tagKey = getTagKey(tag, properties);
        if (!cascadedTagInstances.has(tagKey)) {
          cascadedTagInstances.set(tagKey, []);
        }
        let instances = cascadedTagInstances.get(tagKey);
        let index = instances.length;
        instances = [...instances, tag];
        cascadedTagInstances.set(tagKey, instances);
        return index;
      }
      return -1;
    },
    removeClientTag: (tag, index) => {
      const properties = tag.tag === "title" ? titleTagProperties : metaTagProperties;
      const tagKey = getTagKey(tag, properties);
      if (tag.ref) {
        const t = cascadedTagInstances.get(tagKey);
        if (t) {
          if (tag.ref.parentNode) {
            tag.ref.parentNode.removeChild(tag.ref);
            for (let i = index - 1; i >= 0; i--) {
              if (t[i] != null) {
                document.head.appendChild(t[i].ref);
              }
            }
          }
          t[index] = null;
          cascadedTagInstances.set(tagKey, t);
        } else {
          if (tag.ref.parentNode) {
            tag.ref.parentNode.removeChild(tag.ref);
          }
        }
      }
    }
  };
  {
    actions.addServerTag = (tagDesc) => {
      const {
        tags = []
      } = props;
      if (cascadingTags.indexOf(tagDesc.tag) !== -1) {
        const properties = tagDesc.tag === "title" ? titleTagProperties : metaTagProperties;
        const tagDescKey = getTagKey(tagDesc, properties);
        const index = tags.findIndex((prev) => prev.tag === tagDesc.tag && getTagKey(prev, properties) === tagDescKey);
        if (index !== -1) {
          tags.splice(index, 1);
        }
      }
      tags.push(tagDesc);
    };
    if (Array.isArray(props.tags) === false) {
      throw Error("tags array should be passed to <MetaProvider /> in node");
    }
  }
  return createComponent(MetaContext.Provider, {
    value: actions,
    get children() {
      return props.children;
    }
  });
};
const MetaTag = (tag, props, setting) => {
  const id = createUniqueId();
  const c = useContext(MetaContext);
  if (!c)
    throw new Error("<MetaProvider /> should be in the tree");
  useHead({
    tag,
    props,
    setting,
    id,
    get name() {
      return props.name || props.property;
    }
  });
  return null;
};
function useHead(tagDesc) {
  const {
    addClientTag,
    removeClientTag,
    addServerTag
  } = useContext(MetaContext);
  createRenderEffect(() => {
    if (!isServer) ;
  });
  {
    addServerTag(tagDesc);
    return null;
  }
}
function renderTags(tags) {
  return tags.map((tag) => {
    const keys = Object.keys(tag.props);
    const props = keys.map((k) => k === "children" ? "" : ` ${k}="${// @ts-expect-error
    escape(tag.props[k], true)}"`).join("");
    const children = tag.props.children;
    if (tag.setting?.close) {
      return `<${tag.tag} data-sm="${tag.id}"${props}>${// @ts-expect-error
      tag.setting?.escape ? escape(children) : children || ""}</${tag.tag}>`;
    }
    return `<${tag.tag} data-sm="${tag.id}"${props}/>`;
  }).join("");
}
const Meta$1 = (props) => MetaTag("meta", props);

const BASE_PATH = "https://chat.johannes-jahn.com".replace(/\/+$/, "");
class Configuration {
  constructor(configuration = {}) {
    this.configuration = configuration;
  }
  set config(configuration) {
    this.configuration = configuration;
  }
  get basePath() {
    return this.configuration.basePath != null ? this.configuration.basePath : BASE_PATH;
  }
  get fetchApi() {
    return this.configuration.fetchApi;
  }
  get middleware() {
    return this.configuration.middleware || [];
  }
  get queryParamsStringify() {
    return this.configuration.queryParamsStringify || querystring;
  }
  get username() {
    return this.configuration.username;
  }
  get password() {
    return this.configuration.password;
  }
  get apiKey() {
    const apiKey = this.configuration.apiKey;
    if (apiKey) {
      return typeof apiKey === "function" ? apiKey : () => apiKey;
    }
    return void 0;
  }
  get accessToken() {
    const accessToken = this.configuration.accessToken;
    if (accessToken) {
      return typeof accessToken === "function" ? accessToken : async () => accessToken;
    }
    return void 0;
  }
  get headers() {
    return this.configuration.headers;
  }
  get credentials() {
    return this.configuration.credentials;
  }
}
const DefaultConfig = new Configuration();
class BaseAPI {
  constructor(configuration = DefaultConfig) {
    this.configuration = configuration;
    this.middleware = configuration.middleware;
  }
  static jsonRegex = new RegExp("^(:?application/json|[^;/ 	]+/[^;/ 	]+[+]json)[ 	]*(:?;.*)?$", "i");
  middleware;
  withMiddleware(...middlewares) {
    const next = this.clone();
    next.middleware = next.middleware.concat(...middlewares);
    return next;
  }
  withPreMiddleware(...preMiddlewares) {
    const middlewares = preMiddlewares.map((pre) => ({ pre }));
    return this.withMiddleware(...middlewares);
  }
  withPostMiddleware(...postMiddlewares) {
    const middlewares = postMiddlewares.map((post) => ({ post }));
    return this.withMiddleware(...middlewares);
  }
  /**
   * Check if the given MIME is a JSON MIME.
   * JSON MIME examples:
   *   application/json
   *   application/json; charset=UTF8
   *   APPLICATION/JSON
   *   application/vnd.company+json
   * @param mime - MIME (Multipurpose Internet Mail Extensions)
   * @return True if the given MIME is JSON, false otherwise.
   */
  isJsonMime(mime) {
    if (!mime) {
      return false;
    }
    return BaseAPI.jsonRegex.test(mime);
  }
  async request(context, initOverrides) {
    const { url, init } = await this.createFetchParams(context, initOverrides);
    const response = await this.fetchApi(url, init);
    if (response && (response.status >= 200 && response.status < 300)) {
      return response;
    }
    throw new ResponseError(response, "Response returned an error code");
  }
  async createFetchParams(context, initOverrides) {
    let url = this.configuration.basePath + context.path;
    if (context.query !== void 0 && Object.keys(context.query).length !== 0) {
      url += "?" + this.configuration.queryParamsStringify(context.query);
    }
    const headers = Object.assign({}, this.configuration.headers, context.headers);
    Object.keys(headers).forEach((key) => headers[key] === void 0 ? delete headers[key] : {});
    const initOverrideFn = typeof initOverrides === "function" ? initOverrides : async () => initOverrides;
    const initParams = {
      method: context.method,
      headers,
      body: context.body,
      credentials: this.configuration.credentials
    };
    const overriddenInit = {
      ...initParams,
      ...await initOverrideFn({
        init: initParams,
        context
      })
    };
    const init = {
      ...overriddenInit,
      body: isFormData(overriddenInit.body) || overriddenInit.body instanceof URLSearchParams || isBlob(overriddenInit.body) ? overriddenInit.body : JSON.stringify(overriddenInit.body)
    };
    return { url, init };
  }
  fetchApi = async (url, init) => {
    let fetchParams = { url, init };
    for (const middleware of this.middleware) {
      if (middleware.pre) {
        fetchParams = await middleware.pre({
          fetch: this.fetchApi,
          ...fetchParams
        }) || fetchParams;
      }
    }
    let response = void 0;
    try {
      response = await (this.configuration.fetchApi || fetch)(fetchParams.url, fetchParams.init);
    } catch (e) {
      for (const middleware of this.middleware) {
        if (middleware.onError) {
          response = await middleware.onError({
            fetch: this.fetchApi,
            url: fetchParams.url,
            init: fetchParams.init,
            error: e,
            response: response ? response.clone() : void 0
          }) || response;
        }
      }
      if (response === void 0) {
        if (e instanceof Error) {
          throw new FetchError(e, "The request failed and the interceptors did not return an alternative response");
        } else {
          throw e;
        }
      }
    }
    for (const middleware of this.middleware) {
      if (middleware.post) {
        response = await middleware.post({
          fetch: this.fetchApi,
          url: fetchParams.url,
          init: fetchParams.init,
          response: response.clone()
        }) || response;
      }
    }
    return response;
  };
  /**
   * Create a shallow clone of `this` by constructing a new instance
   * and then shallow cloning data members.
   */
  clone() {
    const constructor = this.constructor;
    const next = new constructor(this.configuration);
    next.middleware = this.middleware.slice();
    return next;
  }
}
function isBlob(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}
function isFormData(value) {
  return typeof FormData !== "undefined" && value instanceof FormData;
}
class ResponseError extends Error {
  constructor(response, msg) {
    super(msg);
    this.response = response;
  }
  name = "ResponseError";
}
class FetchError extends Error {
  constructor(cause, msg) {
    super(msg);
    this.cause = cause;
  }
  name = "FetchError";
}
class RequiredError extends Error {
  constructor(field, msg) {
    super(msg);
    this.field = field;
  }
  name = "RequiredError";
}
function querystring(params, prefix = "") {
  return Object.keys(params).map((key) => querystringSingleKey(key, params[key], prefix)).filter((part) => part.length > 0).join("&");
}
function querystringSingleKey(key, value, keyPrefix = "") {
  const fullKey = keyPrefix + (keyPrefix.length ? `[${key}]` : key);
  if (value instanceof Array) {
    const multiValue = value.map((singleValue) => encodeURIComponent(String(singleValue))).join(`&${encodeURIComponent(fullKey)}=`);
    return `${encodeURIComponent(fullKey)}=${multiValue}`;
  }
  if (value instanceof Set) {
    const valueAsArray = Array.from(value);
    return querystringSingleKey(key, valueAsArray, keyPrefix);
  }
  if (value instanceof Date) {
    return `${encodeURIComponent(fullKey)}=${encodeURIComponent(value.toISOString())}`;
  }
  if (value instanceof Object) {
    return querystring(value, fullKey);
  }
  return `${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`;
}
class JSONApiResponse {
  constructor(raw, transformer = (jsonValue) => jsonValue) {
    this.raw = raw;
    this.transformer = transformer;
  }
  async value() {
    return this.transformer(await this.raw.json());
  }
}
class VoidApiResponse {
  constructor(raw) {
    this.raw = raw;
  }
  async value() {
    return void 0;
  }
}

function UserResponseDTOFromJSON(json) {
  return UserResponseDTOFromJSONTyped(json);
}
function UserResponseDTOFromJSONTyped(json, ignoreDiscriminator) {
  if (json === void 0 || json === null) {
    return json;
  }
  return {
    "id": json["id"],
    "username": json["username"]
  };
}

function ReplyResponseDTOFromJSON(json) {
  return ReplyResponseDTOFromJSONTyped(json);
}
function ReplyResponseDTOFromJSONTyped(json, ignoreDiscriminator) {
  if (json === void 0 || json === null) {
    return json;
  }
  return {
    "id": json["id"],
    "createdAt": new Date(json["createdAt"]),
    "updatedAt": new Date(json["updatedAt"]),
    "content": json["content"],
    "author": UserResponseDTOFromJSON(json["author"])
  };
}

function CommentResponseDTOFromJSON(json) {
  return CommentResponseDTOFromJSONTyped(json);
}
function CommentResponseDTOFromJSONTyped(json, ignoreDiscriminator) {
  if (json === void 0 || json === null) {
    return json;
  }
  return {
    "id": json["id"],
    "createdAt": new Date(json["createdAt"]),
    "updatedAt": new Date(json["updatedAt"]),
    "content": json["content"],
    "author": UserResponseDTOFromJSON(json["author"]),
    "replies": json["replies"].map(ReplyResponseDTOFromJSON)
  };
}

function CreateCommentDTOToJSON(value) {
  if (value === void 0) {
    return void 0;
  }
  if (value === null) {
    return null;
  }
  return {
    "postId": value.postId,
    "content": value.content
  };
}

function CreatePostDTOToJSON(value) {
  if (value === void 0) {
    return void 0;
  }
  if (value === null) {
    return null;
  }
  return {
    "content": value.content,
    "contentType": value.contentType
  };
}

function CreateReplyDTOToJSON(value) {
  if (value === void 0) {
    return void 0;
  }
  if (value === null) {
    return null;
  }
  return {
    "commentId": value.commentId,
    "content": value.content
  };
}

function DeleteCommentDTOToJSON(value) {
  if (value === void 0) {
    return void 0;
  }
  if (value === null) {
    return null;
  }
  return {
    "commentId": value.commentId
  };
}

function DeletePostDTOToJSON(value) {
  if (value === void 0) {
    return void 0;
  }
  if (value === null) {
    return null;
  }
  return {
    "id": value.id
  };
}

function DeleteReplyDTOToJSON(value) {
  if (value === void 0) {
    return void 0;
  }
  if (value === null) {
    return null;
  }
  return {
    "replyId": value.replyId
  };
}

function PostResponseDTOFromJSON(json) {
  return PostResponseDTOFromJSONTyped(json);
}
function PostResponseDTOFromJSONTyped(json, ignoreDiscriminator) {
  if (json === void 0 || json === null) {
    return json;
  }
  return {
    "id": json["id"],
    "createdAt": new Date(json["createdAt"]),
    "updatedAt": new Date(json["updatedAt"]),
    "content": json["content"],
    "contentType": json["contentType"],
    "author": UserResponseDTOFromJSON(json["author"]),
    "comments": json["comments"] === null ? null : json["comments"].map(CommentResponseDTOFromJSON)
  };
}

function UpdateCommentDTOToJSON(value) {
  if (value === void 0) {
    return void 0;
  }
  if (value === null) {
    return null;
  }
  return {
    "commentId": value.commentId,
    "content": value.content
  };
}

function UpdatePostDTOToJSON(value) {
  if (value === void 0) {
    return void 0;
  }
  if (value === null) {
    return null;
  }
  return {
    "id": value.id,
    "content": value.content,
    "contentType": value.contentType
  };
}

function UpdateReplyDTOToJSON(value) {
  if (value === void 0) {
    return void 0;
  }
  if (value === null) {
    return null;
  }
  return {
    "replyId": value.replyId,
    "content": value.content
  };
}

class PostApi extends BaseAPI {
  /**
   * Create comment with the authenticated user
   * 
   */
  async postControllerCreateCommentRaw(requestParameters, initOverrides) {
    if (requestParameters.createCommentDTO === null || requestParameters.createCommentDTO === void 0) {
      throw new RequiredError("createCommentDTO", "Required parameter requestParameters.createCommentDTO was null or undefined when calling postControllerCreateComment.");
    }
    const queryParameters = {};
    const headerParameters = {};
    headerParameters["Content-Type"] = "application/json";
    if (this.configuration && this.configuration.accessToken) {
      const token = this.configuration.accessToken;
      const tokenString = await token("bearer", []);
      if (tokenString) {
        headerParameters["Authorization"] = `Bearer ${tokenString}`;
      }
    }
    const response = await this.request({
      path: `/app/post/comment`,
      method: "POST",
      headers: headerParameters,
      query: queryParameters,
      body: CreateCommentDTOToJSON(requestParameters.createCommentDTO)
    }, initOverrides);
    return new JSONApiResponse(response, (jsonValue) => CommentResponseDTOFromJSON(jsonValue));
  }
  /**
   * Create comment with the authenticated user
   * 
   */
  async postControllerCreateComment(requestParameters, initOverrides) {
    const response = await this.postControllerCreateCommentRaw(requestParameters, initOverrides);
    return await response.value();
  }
  /**
   * Create post with the authenticated user
   * 
   */
  async postControllerCreatePostRaw(requestParameters, initOverrides) {
    if (requestParameters.createPostDTO === null || requestParameters.createPostDTO === void 0) {
      throw new RequiredError("createPostDTO", "Required parameter requestParameters.createPostDTO was null or undefined when calling postControllerCreatePost.");
    }
    const queryParameters = {};
    const headerParameters = {};
    headerParameters["Content-Type"] = "application/json";
    if (this.configuration && this.configuration.accessToken) {
      const token = this.configuration.accessToken;
      const tokenString = await token("bearer", []);
      if (tokenString) {
        headerParameters["Authorization"] = `Bearer ${tokenString}`;
      }
    }
    const response = await this.request({
      path: `/app/post`,
      method: "POST",
      headers: headerParameters,
      query: queryParameters,
      body: CreatePostDTOToJSON(requestParameters.createPostDTO)
    }, initOverrides);
    return new JSONApiResponse(response, (jsonValue) => PostResponseDTOFromJSON(jsonValue));
  }
  /**
   * Create post with the authenticated user
   * 
   */
  async postControllerCreatePost(requestParameters, initOverrides) {
    const response = await this.postControllerCreatePostRaw(requestParameters, initOverrides);
    return await response.value();
  }
  /**
   * Create reply with the authenticated user
   * 
   */
  async postControllerCreateReplyRaw(requestParameters, initOverrides) {
    if (requestParameters.createReplyDTO === null || requestParameters.createReplyDTO === void 0) {
      throw new RequiredError("createReplyDTO", "Required parameter requestParameters.createReplyDTO was null or undefined when calling postControllerCreateReply.");
    }
    const queryParameters = {};
    const headerParameters = {};
    headerParameters["Content-Type"] = "application/json";
    if (this.configuration && this.configuration.accessToken) {
      const token = this.configuration.accessToken;
      const tokenString = await token("bearer", []);
      if (tokenString) {
        headerParameters["Authorization"] = `Bearer ${tokenString}`;
      }
    }
    const response = await this.request({
      path: `/app/post/reply`,
      method: "POST",
      headers: headerParameters,
      query: queryParameters,
      body: CreateReplyDTOToJSON(requestParameters.createReplyDTO)
    }, initOverrides);
    return new JSONApiResponse(response, (jsonValue) => ReplyResponseDTOFromJSON(jsonValue));
  }
  /**
   * Create reply with the authenticated user
   * 
   */
  async postControllerCreateReply(requestParameters, initOverrides) {
    const response = await this.postControllerCreateReplyRaw(requestParameters, initOverrides);
    return await response.value();
  }
  /**
   * Delete a comment that belongs to the currently authenticated user
   * 
   */
  async postControllerDeleteCommentRaw(requestParameters, initOverrides) {
    if (requestParameters.deleteCommentDTO === null || requestParameters.deleteCommentDTO === void 0) {
      throw new RequiredError("deleteCommentDTO", "Required parameter requestParameters.deleteCommentDTO was null or undefined when calling postControllerDeleteComment.");
    }
    const queryParameters = {};
    const headerParameters = {};
    headerParameters["Content-Type"] = "application/json";
    if (this.configuration && this.configuration.accessToken) {
      const token = this.configuration.accessToken;
      const tokenString = await token("bearer", []);
      if (tokenString) {
        headerParameters["Authorization"] = `Bearer ${tokenString}`;
      }
    }
    const response = await this.request({
      path: `/app/post/comment`,
      method: "DELETE",
      headers: headerParameters,
      query: queryParameters,
      body: DeleteCommentDTOToJSON(requestParameters.deleteCommentDTO)
    }, initOverrides);
    return new VoidApiResponse(response);
  }
  /**
   * Delete a comment that belongs to the currently authenticated user
   * 
   */
  async postControllerDeleteComment(requestParameters, initOverrides) {
    await this.postControllerDeleteCommentRaw(requestParameters, initOverrides);
  }
  /**
   * Delete a post that belongs to the currently authenticated user
   * 
   */
  async postControllerDeletePostRaw(requestParameters, initOverrides) {
    if (requestParameters.deletePostDTO === null || requestParameters.deletePostDTO === void 0) {
      throw new RequiredError("deletePostDTO", "Required parameter requestParameters.deletePostDTO was null or undefined when calling postControllerDeletePost.");
    }
    const queryParameters = {};
    const headerParameters = {};
    headerParameters["Content-Type"] = "application/json";
    if (this.configuration && this.configuration.accessToken) {
      const token = this.configuration.accessToken;
      const tokenString = await token("bearer", []);
      if (tokenString) {
        headerParameters["Authorization"] = `Bearer ${tokenString}`;
      }
    }
    const response = await this.request({
      path: `/app/post`,
      method: "DELETE",
      headers: headerParameters,
      query: queryParameters,
      body: DeletePostDTOToJSON(requestParameters.deletePostDTO)
    }, initOverrides);
    return new VoidApiResponse(response);
  }
  /**
   * Delete a post that belongs to the currently authenticated user
   * 
   */
  async postControllerDeletePost(requestParameters, initOverrides) {
    await this.postControllerDeletePostRaw(requestParameters, initOverrides);
  }
  /**
   * Delete reply with the authenticated user
   * 
   */
  async postControllerDeleteReplyRaw(requestParameters, initOverrides) {
    if (requestParameters.deleteReplyDTO === null || requestParameters.deleteReplyDTO === void 0) {
      throw new RequiredError("deleteReplyDTO", "Required parameter requestParameters.deleteReplyDTO was null or undefined when calling postControllerDeleteReply.");
    }
    const queryParameters = {};
    const headerParameters = {};
    headerParameters["Content-Type"] = "application/json";
    if (this.configuration && this.configuration.accessToken) {
      const token = this.configuration.accessToken;
      const tokenString = await token("bearer", []);
      if (tokenString) {
        headerParameters["Authorization"] = `Bearer ${tokenString}`;
      }
    }
    const response = await this.request({
      path: `/app/post/reply`,
      method: "DELETE",
      headers: headerParameters,
      query: queryParameters,
      body: DeleteReplyDTOToJSON(requestParameters.deleteReplyDTO)
    }, initOverrides);
    return new VoidApiResponse(response);
  }
  /**
   * Delete reply with the authenticated user
   * 
   */
  async postControllerDeleteReply(requestParameters, initOverrides) {
    await this.postControllerDeleteReplyRaw(requestParameters, initOverrides);
  }
  /**
   * Get comments of a post
   * 
   */
  async postControllerGetCommentsRaw(requestParameters, initOverrides) {
    if (requestParameters.postId === null || requestParameters.postId === void 0) {
      throw new RequiredError("postId", "Required parameter requestParameters.postId was null or undefined when calling postControllerGetComments.");
    }
    const queryParameters = {};
    const headerParameters = {};
    const response = await this.request({
      path: `/app/post/comment/{postId}`.replace(`{${"postId"}}`, encodeURIComponent(String(requestParameters.postId))),
      method: "GET",
      headers: headerParameters,
      query: queryParameters
    }, initOverrides);
    return new JSONApiResponse(response, (jsonValue) => jsonValue.map(CommentResponseDTOFromJSON));
  }
  /**
   * Get comments of a post
   * 
   */
  async postControllerGetComments(requestParameters, initOverrides) {
    const response = await this.postControllerGetCommentsRaw(requestParameters, initOverrides);
    return await response.value();
  }
  /**
   * Get all posts
   * 
   */
  async postControllerGetPostsRaw(initOverrides) {
    const queryParameters = {};
    const headerParameters = {};
    const response = await this.request({
      path: `/app/post`,
      method: "GET",
      headers: headerParameters,
      query: queryParameters
    }, initOverrides);
    return new JSONApiResponse(response, (jsonValue) => jsonValue.map(PostResponseDTOFromJSON));
  }
  /**
   * Get all posts
   * 
   */
  async postControllerGetPosts(initOverrides) {
    const response = await this.postControllerGetPostsRaw(initOverrides);
    return await response.value();
  }
  /**
   * Get replies of a comment
   * 
   */
  async postControllerGetRepliesRaw(requestParameters, initOverrides) {
    if (requestParameters.commentId === null || requestParameters.commentId === void 0) {
      throw new RequiredError("commentId", "Required parameter requestParameters.commentId was null or undefined when calling postControllerGetReplies.");
    }
    const queryParameters = {};
    const headerParameters = {};
    const response = await this.request({
      path: `/app/post/reply/{commentId}`.replace(`{${"commentId"}}`, encodeURIComponent(String(requestParameters.commentId))),
      method: "GET",
      headers: headerParameters,
      query: queryParameters
    }, initOverrides);
    return new JSONApiResponse(response, (jsonValue) => jsonValue.map(ReplyResponseDTOFromJSON));
  }
  /**
   * Get replies of a comment
   * 
   */
  async postControllerGetReplies(requestParameters, initOverrides) {
    const response = await this.postControllerGetRepliesRaw(requestParameters, initOverrides);
    return await response.value();
  }
  /**
   * Update a comment that belongs to the currently authenticated user
   * 
   */
  async postControllerUpdateCommentRaw(requestParameters, initOverrides) {
    if (requestParameters.updateCommentDTO === null || requestParameters.updateCommentDTO === void 0) {
      throw new RequiredError("updateCommentDTO", "Required parameter requestParameters.updateCommentDTO was null or undefined when calling postControllerUpdateComment.");
    }
    const queryParameters = {};
    const headerParameters = {};
    headerParameters["Content-Type"] = "application/json";
    if (this.configuration && this.configuration.accessToken) {
      const token = this.configuration.accessToken;
      const tokenString = await token("bearer", []);
      if (tokenString) {
        headerParameters["Authorization"] = `Bearer ${tokenString}`;
      }
    }
    const response = await this.request({
      path: `/app/post/comment`,
      method: "PUT",
      headers: headerParameters,
      query: queryParameters,
      body: UpdateCommentDTOToJSON(requestParameters.updateCommentDTO)
    }, initOverrides);
    return new JSONApiResponse(response, (jsonValue) => CommentResponseDTOFromJSON(jsonValue));
  }
  /**
   * Update a comment that belongs to the currently authenticated user
   * 
   */
  async postControllerUpdateComment(requestParameters, initOverrides) {
    const response = await this.postControllerUpdateCommentRaw(requestParameters, initOverrides);
    return await response.value();
  }
  /**
   * Update a post that belongs to the currently authenticated user
   * 
   */
  async postControllerUpdatePostRaw(requestParameters, initOverrides) {
    if (requestParameters.updatePostDTO === null || requestParameters.updatePostDTO === void 0) {
      throw new RequiredError("updatePostDTO", "Required parameter requestParameters.updatePostDTO was null or undefined when calling postControllerUpdatePost.");
    }
    const queryParameters = {};
    const headerParameters = {};
    headerParameters["Content-Type"] = "application/json";
    if (this.configuration && this.configuration.accessToken) {
      const token = this.configuration.accessToken;
      const tokenString = await token("bearer", []);
      if (tokenString) {
        headerParameters["Authorization"] = `Bearer ${tokenString}`;
      }
    }
    const response = await this.request({
      path: `/app/post`,
      method: "PUT",
      headers: headerParameters,
      query: queryParameters,
      body: UpdatePostDTOToJSON(requestParameters.updatePostDTO)
    }, initOverrides);
    return new JSONApiResponse(response, (jsonValue) => PostResponseDTOFromJSON(jsonValue));
  }
  /**
   * Update a post that belongs to the currently authenticated user
   * 
   */
  async postControllerUpdatePost(requestParameters, initOverrides) {
    const response = await this.postControllerUpdatePostRaw(requestParameters, initOverrides);
    return await response.value();
  }
  /**
   * Update reply with the authenticated user
   * 
   */
  async postControllerUpdateReplyRaw(requestParameters, initOverrides) {
    if (requestParameters.updateReplyDTO === null || requestParameters.updateReplyDTO === void 0) {
      throw new RequiredError("updateReplyDTO", "Required parameter requestParameters.updateReplyDTO was null or undefined when calling postControllerUpdateReply.");
    }
    const queryParameters = {};
    const headerParameters = {};
    headerParameters["Content-Type"] = "application/json";
    if (this.configuration && this.configuration.accessToken) {
      const token = this.configuration.accessToken;
      const tokenString = await token("bearer", []);
      if (tokenString) {
        headerParameters["Authorization"] = `Bearer ${tokenString}`;
      }
    }
    const response = await this.request({
      path: `/app/post/reply`,
      method: "PUT",
      headers: headerParameters,
      query: queryParameters,
      body: UpdateReplyDTOToJSON(requestParameters.updateReplyDTO)
    }, initOverrides);
    return new JSONApiResponse(response, (jsonValue) => ReplyResponseDTOFromJSON(jsonValue));
  }
  /**
   * Update reply with the authenticated user
   * 
   */
  async postControllerUpdateReply(requestParameters, initOverrides) {
    const response = await this.postControllerUpdateReplyRaw(requestParameters, initOverrides);
    return await response.value();
  }
}

var _tmpl$$4 = ["<p", ' class="contents">', "</p>"], _tmpl$2$3 = ["<img", ' class="postImage"', ">"], _tmpl$3$3 = ["<div", ' class="card bg-base-200 shadow-xl m-5 postSize"><div class="card-body flex flex-col justify-center items-center"><!--$-->', "<!--/--><!--$-->", '<!--/--></div><div class="flex flex-row items-center justify-end m-2"><div class="avatar"><div class="w-10 rounded-full"><img', '></div></div><p class="text-xs m-2"><!--$-->', "<!--/-->, <!--$-->", "<!--/--></p></div></div>"];
const PostComponent = ({
  post
}) => {
  return ssr(_tmpl$3$3, ssrHydrationKey(), escape(createComponent(Show, {
    get when() {
      return post.contentType == "TEXT";
    },
    get children() {
      return ssr(_tmpl$$4, ssrHydrationKey(), escape(post.content));
    }
  })), escape(createComponent(Show, {
    get when() {
      return post.contentType == "IMAGE_URL";
    },
    get children() {
      return ssr(_tmpl$2$3, ssrHydrationKey(), ssrAttribute("src", escape(post.content, true), false));
    }
  })), ssrAttribute("src", escape(BASE_PATH, true) + "/app/user/avatar/" + escape(post.author.id, true), false), escape(post.author.username), escape(post.createdAt.toLocaleDateString()));
};

const $$server_module0$1 = server$.createHandler(async function $$serverHandler0() {
  return new PostApi().postControllerGetPosts();
}, "/_m/0dbe216f23/routeData", true);
server$.registerHandler("/_m/0dbe216f23/routeData", $$server_module0$1);
const routeData = () => createRouteData($$server_module0$1);

var _tmpl$$3 = ["<div", ' style="', '"><div style="', '"><p style="', '" id="error-message">', '</p><button id="reset-errors" style="', '">Clear errors and retry</button><pre style="', '">', "</pre></div></div>"];
function ErrorBoundary(props) {
  return createComponent(ErrorBoundary$1, {
    fallback: (e, reset) => {
      return createComponent(Show, {
        get when() {
          return !props.fallback;
        },
        get fallback() {
          return props.fallback && props.fallback(e, reset);
        },
        get children() {
          return createComponent(ErrorMessage, {
            error: e
          });
        }
      });
    },
    get children() {
      return props.children;
    }
  });
}
function ErrorMessage(props) {
  return ssr(_tmpl$$3, ssrHydrationKey(), "padding:16px", "background-color:rgba(252, 165, 165);color:rgb(153, 27, 27);border-radius:5px;overflow:scroll;padding:16px;margin-bottom:8px", "font-weight:bold", escape(props.error.message), "color:rgba(252, 165, 165);background-color:rgb(153, 27, 27);border-radius:5px;padding:4px 8px", "margin-top:8px;width:100%", escape(props.error.stack));
}

const routeLayouts = {
  "/": {
    "id": "/",
    "layouts": []
  }
};

var _tmpl$$2 = ["<link", ' rel="stylesheet"', ">"], _tmpl$2$2 = ["<link", ' rel="modulepreload"', ">"];
function flattenIslands(match, manifest) {
  let result = [...match];
  match.forEach((m) => {
    if (m.type !== "island")
      return;
    const islandManifest = manifest[m.href];
    if (islandManifest) {
      const res = flattenIslands(islandManifest.assets, manifest);
      result.push(...res);
    }
  });
  return result;
}
function getAssetsFromManifest(manifest, routerContext) {
  let match = routerContext.matches ? routerContext.matches.reduce((memo, m) => {
    if (m.length) {
      const fullPath = m.reduce((previous, match2) => previous + match2.originalPath, "");
      const route = routeLayouts[fullPath];
      if (route) {
        memo.push(...manifest[route.id] || []);
        const layoutsManifestEntries = route.layouts.flatMap((manifestKey) => manifest[manifestKey] || []);
        memo.push(...layoutsManifestEntries);
      }
    }
    return memo;
  }, []) : [];
  match.push(...manifest["entry-client"] || []);
  match = manifest ? flattenIslands(match, manifest) : [];
  const links = match.reduce((r, src) => {
    r[src.href] = src.type === "style" ? ssr(_tmpl$$2, ssrHydrationKey(), ssrAttribute("href", escape(src.href, true), false)) : src.type === "script" ? ssr(_tmpl$2$2, ssrHydrationKey(), ssrAttribute("href", escape(src.href, true), false)) : void 0;
    return r;
  }, {});
  return Object.values(links);
}
function Links() {
  const context = useContext(ServerContext);
  useAssets(() => getAssetsFromManifest(context.env.manifest, context.routerContext));
  return null;
}

function Meta() {
  const context = useContext(ServerContext);
  useAssets(() => ssr(renderTags(context.tags)));
  return null;
}

var _tmpl$3$2 = ["<script", ' type="module" async', "><\/script>"];
const isDev = "production" === "development";
const isIslands = false;
function Scripts() {
  const context = useContext(ServerContext);
  return [createComponent(HydrationScript, {}), isIslands , createComponent(NoHydration, {
    get children() {
      return ((                ssr(_tmpl$3$2, ssrHydrationKey(), ssrAttribute("src", escape(context.env.manifest["entry-client"][0].href, true), false))
      ) );
    }
  }), isDev ];
}

function Html(props) {
  {
    return ssrElement("html", props, void 0, false);
  }
}
function Head(props) {
  {
    return ssrElement("head", props, () => [escape(props.children), createComponent(Meta, {}), createComponent(Links, {})], false);
  }
}
function Body(props) {
  {
    return ssrElement("body", props, () => escape(props.children) , false);
  }
}

const MeContext = createContext();
const MeProvider = (props) => {
  const signal = createSignal(null);
  return createComponent(MeContext.Provider, {
    value: signal,
    get children() {
      return props.children;
    }
  });
};
const useMe = () => {
  return useContext(MeContext);
};

var _tmpl$$1 = ["<div", ' class="flex flex-row gap-4 m-4 h-11"><input type="text" placeholder="Username" class="input w-full max-w-xs"><input type="password" placeholder="Password" class="input w-full max-w-xs"><button class="btn">Login</button></div>'], _tmpl$2$1 = ["<div", ' class="avatar m-4 h-11"><div class="w-10 rounded-full"><img', "></div></div>"], _tmpl$3$1 = ["<div", ' class="flex flex-row justify-between items-center"><div class="m-4 text-xl">Solid Nacho</div><!--$-->', "<!--/--><!--$-->", "<!--/--></div>"];
const HeaderComponent = () => {
  const [me, setMe] = useMe();
  return ssr(_tmpl$3$1, ssrHydrationKey(), escape(createComponent(Show, {
    get when() {
      return me() == null;
    },
    get children() {
      return ssr(_tmpl$$1, ssrHydrationKey());
    }
  })), escape(createComponent(Show, {
    get when() {
      return me() != null;
    },
    get children() {
      return ssr(_tmpl$2$1, ssrHydrationKey(), ssrAttribute("src", escape(BASE_PATH, true) + "/app/user/avatar/" + escape(me().id, true), false));
    }
  })));
};

const PostContext = createContext();
const PostProvider = (props) => {
  const store = createStore(props.initial);
  return createComponent(PostContext.Provider, {
    value: store,
    get children() {
      return props.children;
    }
  });
};
const usePost = () => {
  return useContext(PostContext);
};

var _tmpl$ = ["<div", ' class="flex flex-col justify-center items-center">', "</div>"], _tmpl$2 = ["<div", ' class="w-full sticky bottom-0 flex flex-row-reverse"><div class="btn btn-circle m-10">+</div></div>'], _tmpl$3 = ["<div", ' class="', '"><div class="modal-box"><h3 class="font-bold text-lg m-5">Create Post</h3><textarea placeholder="Content" class="input w-full"></textarea><div class="modal-action"><label class="btn btn-error">Cancel</label><label class="btn btn-primary">Create</label></div></div></div>'];
const PostsContainerComponent = () => {
  const [posts, setPosts] = usePost();
  const [showModal, setShowModal] = createSignal(false);
  return [ssr(_tmpl$, ssrHydrationKey(), escape(createComponent(For, {
    each: posts,
    children: (post) => createComponent(PostComponent, {
      post
    })
  }))), ssr(_tmpl$2, ssrHydrationKey()), ssr(_tmpl$3, ssrHydrationKey(), `modal modal-bottom sm:modal-middle ${showModal() ? "modal-open" : ""}`)];
};

const NachoApp = () => {
  const items = useRouteData();
  return createComponent(MeProvider, {
    get children() {
      return createComponent(PostProvider, {
        get initial() {
          return items();
        },
        get children() {
          return [createComponent(HeaderComponent, {}), createComponent(PostsContainerComponent, {})];
        }
      });
    }
  });
};
const $$server_module0 = server$.createHandler(async function $$serverHandler0() {
  return new PostApi().postControllerGetPosts();
}, "/_m/0dbe216f23/routeData", true);
server$.registerHandler("/_m/0dbe216f23/routeData", $$server_module0);

const fileRoutes = [{
  data: routeData,
  component: NachoApp,
  path: "/"
}];
const FileRoutes = () => {
  return fileRoutes;
};

function Root() {
  return createComponent(Html, {
    lang: "en",
    get children() {
      return [createComponent(Head, {
        get children() {
          return [createComponent(Meta$1, {
            charset: "utf-8"
          }), createComponent(Meta$1, {
            name: "viewport",
            content: "width=device-width, initial-scale=1"
          })];
        }
      }), createComponent(Body, {
        get children() {
          return [createComponent(Suspense, {
            get children() {
              return createComponent(ErrorBoundary, {
                get children() {
                  return createComponent(Routes, {
                    get children() {
                      return createComponent(FileRoutes, {});
                    }
                  });
                }
              });
            }
          }), createComponent(Scripts, {})];
        }
      })];
    }
  });
}

const rootData = Object.values(/* #__PURE__ */ Object.assign({

}))[0];
const dataFn = rootData ? rootData.default : void 0;
const composeMiddleware = (exchanges) => ({
  forward
}) => exchanges.reduceRight((forward2, exchange) => exchange({
  forward: forward2
}), forward);
function createHandler(...exchanges) {
  const exchange = composeMiddleware(exchanges);
  return async (event) => {
    return await exchange({
      forward: async (op) => {
        return new Response(null, {
          status: 404
        });
      }
    })(event);
  };
}
function StartRouter(props) {
  return createComponent(Router, props);
}
const docType = ssr("<!DOCTYPE html>");
function StartServer({
  event
}) {
  const parsed = new URL(event.request.url);
  const path = parsed.pathname + parsed.search;
  sharedConfig.context.requestContext = event;
  return createComponent(ServerContext.Provider, {
    value: event,
    get children() {
      return createComponent(MetaProvider, {
        get tags() {
          return event.tags;
        },
        get children() {
          return createComponent(StartRouter, {
            url: path,
            get out() {
              return event.routerContext;
            },
            location: path,
            get prevLocation() {
              return event.prevUrl;
            },
            data: dataFn,
            routes: fileRoutes,
            get children() {
              return [docType, createComponent(Root, {})];
            }
          });
        }
      });
    }
  });
}

const entryServer = createHandler(renderAsync((event) => createComponent(StartServer, {
  event
})));

const onRequestGet = async ({ request, next, env }) => {
  // Handle static assets
  if (/\.\w+$/.test(request.url)) {
    let resp = await next(request);
    if (resp.status === 200 || 304) {
      return resp;
    }
  }

  env.manifest = manifest;
  env.next = next;
  env.getStaticHTML = async path => {
    return next();
  };
  return entryServer({
    request: request,
    clientAddress: request.headers.get('cf-connecting-ip'),
    locals: {},
    env
  });
};

const onRequestHead = async ({ request, next, env }) => {
  // Handle static assets
  if (/\.\w+$/.test(request.url)) {
    let resp = await next(request);
    if (resp.status === 200 || 304) {
      return resp;
    }
  }

  env.manifest = manifest;
  env.next = next;
  env.getStaticHTML = async path => {
    return next();
  };
  return entryServer({
    request: request,
    env
  });
};

async function onRequestPost({ request, env }) {
  // Allow for POST /_m/33fbce88a9 server function
  env.manifest = manifest;
  return entryServer({
    request: request,
    env
  });
}

async function onRequestDelete({ request, env }) {
  // Allow for POST /_m/33fbce88a9 server function
  env.manifest = manifest;
  return entryServer({
    request: request,
    env
  });
}

async function onRequestPatch({ request, env }) {
  // Allow for POST /_m/33fbce88a9 server function
  env.manifest = manifest;
  return entryServer({
    request: request,
    env
  });
}

export { onRequestDelete, onRequestGet, onRequestHead, onRequestPatch, onRequestPost };
