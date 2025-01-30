var manifest = {
	"/": [
	{
		type: "script",
		href: "/assets/index-d1d91dfa.js"
	},
	{
		type: "script",
		href: "/assets/entry-client-36a46cf4.js"
	},
	{
		type: "style",
		href: "/assets/entry-client-1d28634e.css"
	}
],
	"entry-client": [
	{
		type: "script",
		href: "/assets/entry-client-36a46cf4.js"
	},
	{
		type: "style",
		href: "/assets/entry-client-1d28634e.css"
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
    handleError(e, (owner && owner.owner) || null);
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
    if (!Owner.owned) Owner.owned = [o];
    else Owner.owned.push(o);
  }
  return o;
}
function createRoot(fn, detachedOwner) {
  const owner = Owner,
    current = detachedOwner === undefined ? owner : detachedOwner,
    root =
      fn.length === 0
        ? UNOWNED
        : {
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
  return [
    () => value,
    v => {
      return (value = typeof v === "function" ? v(value) : v);
    }
  ];
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
    if (!Owner.cleanups) Owner.cleanups = [fn];
    else Owner.cleanups.push(fn);
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
  return Owner && Owner.context && Owner.context[context.id] !== undefined
    ? Owner.context[context.id]
    : context.defaultValue;
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

function escape$1(s, attr) {
  const t = typeof s;
  if (t !== "string") {
    if (t === "function") return escape$1(s());
    if (Array.isArray(s)) {
      for (let i = 0; i < s.length; i++) s[i] = escape$1(s[i]);
      return s;
    }
    return s;
  }
  const delim = "<";
  const escDelim = "&lt;";
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
  } else
    while (iAmp >= 0) {
      if (left < iAmp) out += s.substring(left, iAmp);
      out += "&amp;";
      left = iAmp + 1;
      iAmp = s.indexOf("&", left);
    }
  return left < s.length ? out + s.substring(left) : out;
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
      mapped += resolveSSRNode$1((prev = node[i]));
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
    if (!this.context)
      throw new Error(`getNextContextId cannot be used under non-hydrating context`);
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
  return sharedConfig.context
    ? {
        ...sharedConfig.context,
        id: sharedConfig.getNextContextId(),
        count: 0
      }
    : undefined;
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
  return props.when
    ? typeof (c = props.children) === "function"
      ? c(props.keyed ? props.when : () => props.when)
      : c
    : props.fallback || "";
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
    return catchError(
      () => (res = props.children),
      err => {
        error = err;
        !sync && ctx.replace("e" + id, displayFallback);
        sync = true;
      }
    );
  });
  if (error) return displayFallback();
  sync = false;
  return {
    t: `<!--!$e${id}-->${resolveSSRNode$1(escape$1(res))}<!--!$/e${id}-->`
  };
}
const SuspenseContext = createContext();
let resourceContext = null;
function createResource(source, fetcher, options = {}) {
  if (typeof fetcher !== "function") {
    options = fetcher || {};
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
      if (!resource.data && !resource.ref[0].loading && !resource.ref[0].error)
        resource.ref[1].refetch();
      return resource.ref;
    }
  }
  const read = () => {
    if (error) throw error;
    const resolved =
      options.ssrLoadFrom !== "initial" &&
      sharedConfig.context.async &&
      "data" in sharedConfig.context.resources[id];
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
    if (!ctx.async) return (read.loading = !!(typeof source === "function" ? source() : source));
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
      p = p
        .then(res => {
          read.loading = false;
          read.state = "ready";
          ctx.resources[id].data = res;
          p = null;
          notifySuspense(contexts);
          return res;
        })
        .catch(err => {
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
  return (resource.ref = [
    read,
    {
      refetch: load,
      mutate: v => (value = v)
    }
  ]);
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
  const value =
    ctx.suspense[id] ||
    (ctx.suspense[id] = {
      resources: new Map(),
      completed: () => {
        const res = runSuspense();
        if (suspenseComplete(value)) {
          done(resolveSSRNode$1(escape$1(res)));
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
    return runWithOwner(o, () =>
      createComponent(SuspenseContext.Provider, {
        value,
        get children() {
          return catchError(() => props.children, suspenseError);
        }
      })
    );
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
        t: `<template id="pl-${id}"></template>${resolveSSRNode$1(
          escape$1(props.fallback)
        )}<!--pl-${id}-->`
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

var F$1=(i=>(i[i.AggregateError=1]="AggregateError",i[i.ArrowFunction=2]="ArrowFunction",i[i.ErrorPrototypeStack=4]="ErrorPrototypeStack",i[i.ObjectAssign=8]="ObjectAssign",i[i.BigIntTypedArray=16]="BigIntTypedArray",i[i.AbortSignal=32]="AbortSignal",i))(F$1||{});function yr(o){switch(o){case'"':return '\\"';case"\\":return "\\\\";case`
`:return "\\n";case"\r":return "\\r";case"\b":return "\\b";case"	":return "\\t";case"\f":return "\\f";case"<":return "\\x3C";case"\u2028":return "\\u2028";case"\u2029":return "\\u2029";default:return}}function p$1(o){let e="",r=0,s;for(let n=0,a=o.length;n<a;n++)s=yr(o[n]),s&&(e+=o.slice(r,n)+s,r=n+1);return r===0?e=o:e+=o.slice(r),e}var E$1="__SEROVAL_REFS__",Z$1="$R",oe=`self.${Z$1}`;function Nr(o){return o==null?`${oe}=${oe}||[]`:`(${oe}=${oe}||{})["${p$1(o)}"]=[]`}function m$1(o,e){if(!o)throw e}var Be=new Map,R=new Map;function ne(o){return Be.has(o)}function We(o){return m$1(ne(o),new ae$1(o)),Be.get(o)}typeof globalThis!="undefined"?Object.defineProperty(globalThis,E$1,{value:R,configurable:!0,writable:!1,enumerable:!1}):typeof window!="undefined"?Object.defineProperty(window,E$1,{value:R,configurable:!0,writable:!1,enumerable:!1}):typeof self!="undefined"?Object.defineProperty(self,E$1,{value:R,configurable:!0,writable:!1,enumerable:!1}):typeof global!="undefined"&&Object.defineProperty(global,E$1,{value:R,configurable:!0,writable:!1,enumerable:!1});function Wr(o){return o}function Je(o,e){for(let r=0,s=e.length;r<s;r++){let n=e[r];o.has(n)||(o.add(n),n.extends&&Je(o,n.extends));}}function f$1(o){if(o){let e=new Set;return Je(e,o),[...e]}}var $e={0:"Symbol.asyncIterator",1:"Symbol.hasInstance",2:"Symbol.isConcatSpreadable",3:"Symbol.iterator",4:"Symbol.match",5:"Symbol.matchAll",6:"Symbol.replace",7:"Symbol.search",8:"Symbol.species",9:"Symbol.split",10:"Symbol.toPrimitive",11:"Symbol.toStringTag",12:"Symbol.unscopables"},le={[Symbol.asyncIterator]:0,[Symbol.hasInstance]:1,[Symbol.isConcatSpreadable]:2,[Symbol.iterator]:3,[Symbol.match]:4,[Symbol.matchAll]:5,[Symbol.replace]:6,[Symbol.search]:7,[Symbol.species]:8,[Symbol.split]:9,[Symbol.toPrimitive]:10,[Symbol.toStringTag]:11,[Symbol.unscopables]:12},qe={2:"!0",3:"!1",1:"void 0",0:"null",4:"-0",5:"1/0",6:"-1/0",7:"0/0"};var ce={0:"Error",1:"EvalError",2:"RangeError",3:"ReferenceError",4:"SyntaxError",5:"TypeError",6:"URIError"},t=void 0;function u$1(o,e,r,s,n,a,i,l,c,d,h,H){return {t:o,i:e,s:r,l:s,c:n,m:a,p:i,e:l,a:c,f:d,b:h,o:H}}function A$1(o){return u$1(2,t,o,t,t,t,t,t,t,t,t,t)}var x$1=A$1(2),I$1=A$1(3),ue=A$1(1),de=A$1(0),Xe=A$1(4),Qe=A$1(5),er=A$1(6),rr=A$1(7);function pe(o){return o instanceof EvalError?1:o instanceof RangeError?2:o instanceof ReferenceError?3:o instanceof SyntaxError?4:o instanceof TypeError?5:o instanceof URIError?6:0}function xr(o){let e=ce[pe(o)];return o.name!==e?{name:o.name}:o.constructor.name!==e?{name:o.constructor.name}:{}}function V$1(o,e){let r=xr(o),s=Object.getOwnPropertyNames(o);for(let n=0,a=s.length,i;n<a;n++)i=s[n],i!=="name"&&i!=="message"&&(i==="stack"?e&4&&(r=r||{},r[i]=o[i]):(r=r||{},r[i]=o[i]));return r}function fe(o){return Object.isFrozen(o)?3:Object.isSealed(o)?2:Object.isExtensible(o)?0:1}function me(o){switch(o){case Number.POSITIVE_INFINITY:return Qe;case Number.NEGATIVE_INFINITY:return er}return o!==o?rr:Object.is(o,-0)?Xe:u$1(0,t,o,t,t,t,t,t,t,t,t,t)}function w(o){return u$1(1,t,p$1(o),t,t,t,t,t,t,t,t,t)}function Se(o){return u$1(3,t,""+o,t,t,t,t,t,t,t,t,t)}function sr(o){return u$1(4,o,t,t,t,t,t,t,t,t,t,t)}function ge(o,e){return u$1(5,o,e.toISOString(),t,t,t,t,t,t,t,t,t)}function he(o,e){return u$1(6,o,t,t,p$1(e.source),e.flags,t,t,t,t,t,t)}function ye(o,e){let r=new Uint8Array(e),s=r.length,n=new Array(s);for(let a=0;a<s;a++)n[a]=r[a];return u$1(19,o,n,t,t,t,t,t,t,t,t,t)}function or(o,e){return u$1(17,o,le[e],t,t,t,t,t,t,t,t,t)}function je(o,e){return u$1(18,o,p$1(We(e)),t,t,t,t,t,t,t,t,t)}function D(o,e,r){return u$1(25,o,r,t,p$1(e),t,t,t,t,t,t,t)}function ve(o,e,r){return u$1(9,o,t,e.length,t,t,t,t,r,t,t,fe(e))}function Ne(o,e){return u$1(21,o,t,t,t,t,t,t,t,e,t,t)}function be(o,e,r){return u$1(15,o,t,e.length,e.constructor.name,t,t,t,t,r,e.byteOffset,t)}function Ae(o,e,r){return u$1(16,o,t,e.length,e.constructor.name,t,t,t,t,r,e.byteOffset,t)}function xe(o,e,r){return u$1(20,o,t,e.byteLength,t,t,t,t,t,r,e.byteOffset,t)}function Ie(o,e,r){return u$1(13,o,pe(e),t,t,p$1(e.message),r,t,t,t,t,t)}function we(o,e,r){return u$1(14,o,pe(e),t,t,p$1(e.message),r,t,t,t,t,t)}function Ee(o,e,r){return u$1(7,o,t,e,t,t,t,t,r,t,t,t)}function B$1(o,e){return u$1(28,t,t,t,t,t,t,t,[o,e],t,t,t)}function j(o,e){return u$1(30,t,t,t,t,t,t,t,[o,e],t,t,t)}function _$1(o,e,r){return u$1(31,o,t,t,t,t,t,t,r,e,t,t)}function Re(o,e){return u$1(32,o,t,t,t,t,t,t,t,e,t,t)}function Pe(o,e){return u$1(33,o,t,t,t,t,t,t,t,e,t,t)}function Ce(o,e){return u$1(34,o,t,t,t,t,t,t,t,e,t,t)}var{toString:_e}=Object.prototype;function Ir(o,e){return e instanceof Error?`Seroval caught an error during the ${o} process.
  
${e.name}
${e.message}

- For more information, please check the "cause" property of this error.
- If you believe this is an error in Seroval, please submit an issue at https://github.com/lxsmnsyc/seroval/issues/new`:`Seroval caught an error during the ${o} process.

"${_e.call(e)}"

For more information, please check the "cause" property of this error.`}var X$1=class X extends Error{constructor(r,s){super(Ir(r,s));this.cause=s;}},M$1=class M extends X$1{constructor(e){super("parsing",e);}},ze=class extends X$1{constructor(e){super("serialization",e);}},S$1=class S extends Error{constructor(r){super(`The value ${_e.call(r)} of type "${typeof r}" cannot be parsed/serialized.
      
There are few workarounds for this problem:
- Transform the value in a way that it can be serialized.
- If the reference is present on multiple runtimes (isomorphic), you can use the Reference API to map the references.`);this.value=r;}},g$1=class g extends Error{constructor(e){super('Unsupported node type "'+e.t+'".');}},U=class extends Error{constructor(e){super('Missing plugin for tag "'+e+'".');}},ae$1=class ae extends Error{constructor(r){super('Missing reference for the value "'+_e.call(r)+'" of type "'+typeof r+'"');this.value=r;}};var P=class{constructor(e,r){this.value=e;this.replacement=r;}};var nr={},ar={};var ir={0:{},1:{},2:{},3:{},4:{},5:{},6:{}};function ke(o){return "__SEROVAL_STREAM__"in o}function L$1(){let o=new Set,e=[],r=!0,s=!0;function n(l){for(let c of o.keys())c.next(l);}function a(l){for(let c of o.keys())c.throw(l);}function i(l){for(let c of o.keys())c.return(l);}return {__SEROVAL_STREAM__:!0,on(l){r&&o.add(l);for(let c=0,d=e.length;c<d;c++){let h=e[c];c===d-1&&!r?s?l.return(h):l.throw(h):l.next(h);}return ()=>{r&&o.delete(l);}},next(l){r&&(e.push(l),n(l));},throw(l){r&&(e.push(l),a(l),r=!1,s=!1,o.clear());},return(l){r&&(e.push(l),i(l),r=!1,s=!0,o.clear());}}}function Fe(o){let e=L$1(),r=o[Symbol.asyncIterator]();async function s(){try{let n=await r.next();n.done?e.return(n.value):(e.next(n.value),await s());}catch(n){e.throw(n);}}return s().catch(()=>{}),e}function W(o){let e=[],r=-1,s=-1,n=o[Symbol.iterator]();for(;;)try{let a=n.next();if(e.push(a.value),a.done){s=e.length-1;break}}catch(a){r=e.length,e.push(a);}return {v:e,t:r,d:s}}var K$1=class K{constructor(e){this.marked=new Set;this.plugins=e.plugins,this.features=47^(e.disabledFeatures||0),this.refs=e.refs||new Map;}markRef(e){this.marked.add(e);}isMarked(e){return this.marked.has(e)}getIndexedValue(e){let r=this.refs.get(e);if(r!=null)return this.markRef(r),{type:1,value:sr(r)};let s=this.refs.size;return this.refs.set(e,s),{type:0,value:s}}getReference(e){let r=this.getIndexedValue(e);return r.type===1?r:ne(e)?{type:2,value:je(r.value,e)}:r}getStrictReference(e){m$1(ne(e),new S$1(e));let r=this.getIndexedValue(e);return r.type===1?r.value:je(r.value,e)}parseFunction(e){return this.getStrictReference(e)}parseWellKnownSymbol(e){let r=this.getReference(e);return r.type!==0?r.value:(m$1(e in le,new S$1(e)),or(r.value,e))}parseSpecialReference(e){let r=this.getIndexedValue(ir[e]);return r.type===1?r.value:u$1(26,r.value,e,t,t,t,t,t,t,t,t,t)}parseIteratorFactory(){let e=this.getIndexedValue(nr);return e.type===1?e.value:u$1(27,e.value,t,t,t,t,t,t,t,this.parseWellKnownSymbol(Symbol.iterator),t,t)}parseAsyncIteratorFactory(){let e=this.getIndexedValue(ar);return e.type===1?e.value:u$1(29,e.value,t,t,t,t,t,t,[this.parseSpecialReference(1),this.parseWellKnownSymbol(Symbol.asyncIterator)],t,t,t)}createObjectNode(e,r,s,n){return u$1(s?11:10,e,t,t,t,t,n,t,t,t,t,fe(r))}createMapNode(e,r,s,n){return u$1(8,e,t,t,t,t,t,{k:r,v:s,s:n},t,this.parseSpecialReference(0),t,t)}createPromiseConstructorNode(e){return u$1(22,e,t,t,t,t,t,t,t,this.parseSpecialReference(1),t,t)}createAbortSignalConstructorNode(e){return u$1(35,e,t,t,t,t,t,t,t,this.parseSpecialReference(5),t,t)}};var Er=/^[$A-Z_][0-9A-Z_$]*$/i;function Ue(o){let e=o[0];return (e==="$"||e==="_"||e>="A"&&e<="Z"||e>="a"&&e<="z")&&Er.test(o)}function re(o){switch(o.t){case 0:return o.s+"="+o.v;case 2:return o.s+".set("+o.k+","+o.v+")";case 1:return o.s+".add("+o.v+")";case 3:return o.s+".delete("+o.k+")"}}function Rr(o){let e=[],r=o[0];for(let s=1,n=o.length,a,i=r;s<n;s++)a=o[s],a.t===0&&a.v===i.v?r={t:0,s:a.s,k:t,v:re(r)}:a.t===2&&a.s===i.s?r={t:2,s:re(r),k:a.k,v:a.v}:a.t===1&&a.s===i.s?r={t:1,s:re(r),k:t,v:a.v}:a.t===3&&a.s===i.s?r={t:3,s:re(r),k:a.k,v:t}:(e.push(r),r=a),i=a;return e.push(r),e}function pr(o){if(o.length){let e="",r=Rr(o);for(let s=0,n=r.length;s<n;s++)e+=re(r[s])+",";return e}return t}var Pr="Object.create(null)",Cr="new Set",zr="new Map",Or="Promise.resolve",Tr="Promise.reject",kr={3:"Object.freeze",2:"Object.seal",1:"Object.preventExtensions",0:t},O$1=class O{constructor(e){this.stack=[];this.flags=[];this.assignments=[];this.plugins=e.plugins,this.features=e.features,this.marked=new Set(e.markedRefs);}createFunction(e,r){return this.features&2?(e.length===1?e[0]:"("+e.join(",")+")")+"=>"+(r.startsWith("{")?"("+r+")":r):"function("+e.join(",")+"){return "+r+"}"}createEffectfulFunction(e,r){return this.features&2?(e.length===1?e[0]:"("+e.join(",")+")")+"=>{"+r+"}":"function("+e.join(",")+"){"+r+"}"}markRef(e){this.marked.add(e);}isMarked(e){return this.marked.has(e)}pushObjectFlag(e,r){e!==0&&(this.markRef(r),this.flags.push({type:e,value:this.getRefParam(r)}));}resolveFlags(){let e="";for(let r=0,s=this.flags,n=s.length;r<n;r++){let a=s[r];e+=kr[a.type]+"("+a.value+"),";}return e}resolvePatches(){let e=pr(this.assignments),r=this.resolveFlags();return e?r?e+r:e:r}createAssignment(e,r){this.assignments.push({t:0,s:e,k:t,v:r});}createAddAssignment(e,r){this.assignments.push({t:1,s:this.getRefParam(e),k:t,v:r});}createSetAssignment(e,r,s){this.assignments.push({t:2,s:this.getRefParam(e),k:r,v:s});}createDeleteAssignment(e,r){this.assignments.push({t:3,s:this.getRefParam(e),k:r,v:t});}createArrayAssign(e,r,s){this.createAssignment(this.getRefParam(e)+"["+r+"]",s);}createObjectAssign(e,r,s){this.createAssignment(this.getRefParam(e)+"."+r,s);}isIndexedValueInStack(e){return e.t===4&&this.stack.includes(e.i)}serializeReference(e){return this.assignIndexedValue(e.i,E$1+'.get("'+e.s+'")')}serializeArrayItem(e,r,s){return r?this.isIndexedValueInStack(r)?(this.markRef(e),this.createArrayAssign(e,s,this.getRefParam(r.i)),""):this.serialize(r):""}serializeArray(e){let r=e.i;if(e.l){this.stack.push(r);let s=e.a,n=this.serializeArrayItem(r,s[0],0),a=n==="";for(let i=1,l=e.l,c;i<l;i++)c=this.serializeArrayItem(r,s[i],i),n+=","+c,a=c==="";return this.stack.pop(),this.pushObjectFlag(e.o,e.i),this.assignIndexedValue(r,"["+n+(a?",]":"]"))}return this.assignIndexedValue(r,"[]")}serializeProperty(e,r,s){if(typeof r=="string"){let n=Number(r),a=n>=0&&n.toString()===r||Ue(r);if(this.isIndexedValueInStack(s)){let i=this.getRefParam(s.i);return this.markRef(e.i),a&&n!==n?this.createObjectAssign(e.i,r,i):this.createArrayAssign(e.i,a?r:'"'+r+'"',i),""}return (a?r:'"'+r+'"')+":"+this.serialize(s)}return "["+this.serialize(r)+"]:"+this.serialize(s)}serializeProperties(e,r){let s=r.s;if(s){let n=r.k,a=r.v;this.stack.push(e.i);let i=this.serializeProperty(e,n[0],a[0]);for(let l=1,c=i;l<s;l++)c=this.serializeProperty(e,n[l],a[l]),i+=(c&&i&&",")+c;return this.stack.pop(),"{"+i+"}"}return "{}"}serializeObject(e){return this.pushObjectFlag(e.o,e.i),this.assignIndexedValue(e.i,this.serializeProperties(e,e.p))}serializeWithObjectAssign(e,r,s){let n=this.serializeProperties(e,r);return n!=="{}"?"Object.assign("+s+","+n+")":s}serializeStringKeyAssignment(e,r,s,n){let a=this.serialize(n),i=Number(s),l=i>=0&&i.toString()===s||Ue(s);if(this.isIndexedValueInStack(n))l&&i!==i?this.createObjectAssign(e.i,s,a):this.createArrayAssign(e.i,l?s:'"'+s+'"',a);else {let c=this.assignments;this.assignments=r,l&&i!==i?this.createObjectAssign(e.i,s,a):this.createArrayAssign(e.i,l?s:'"'+s+'"',a),this.assignments=c;}}serializeAssignment(e,r,s,n){if(typeof s=="string")this.serializeStringKeyAssignment(e,r,s,n);else {let a=this.stack;this.stack=[];let i=this.serialize(n);this.stack=a;let l=this.assignments;this.assignments=r,this.createArrayAssign(e.i,this.serialize(s),i),this.assignments=l;}}serializeAssignments(e,r){let s=r.s;if(s){let n=[],a=r.k,i=r.v;this.stack.push(e.i);for(let l=0;l<s;l++)this.serializeAssignment(e,n,a[l],i[l]);return this.stack.pop(),pr(n)}return t}serializeDictionary(e,r){if(e.p)if(this.features&8)r=this.serializeWithObjectAssign(e,e.p,r);else {this.markRef(e.i);let s=this.serializeAssignments(e,e.p);if(s)return "("+this.assignIndexedValue(e.i,r)+","+s+this.getRefParam(e.i)+")"}return this.assignIndexedValue(e.i,r)}serializeNullConstructor(e){return this.pushObjectFlag(e.o,e.i),this.serializeDictionary(e,Pr)}serializeDate(e){return this.assignIndexedValue(e.i,'new Date("'+e.s+'")')}serializeRegExp(e){return this.assignIndexedValue(e.i,"/"+e.c+"/"+e.m)}serializeSetItem(e,r){return this.isIndexedValueInStack(r)?(this.markRef(e),this.createAddAssignment(e,this.getRefParam(r.i)),""):this.serialize(r)}serializeSet(e){let r=Cr,s=e.l,n=e.i;if(s){let a=e.a;this.stack.push(n);let i=this.serializeSetItem(n,a[0]);for(let l=1,c=i;l<s;l++)c=this.serializeSetItem(n,a[l]),i+=(c&&i&&",")+c;this.stack.pop(),i&&(r+="(["+i+"])");}return this.assignIndexedValue(n,r)}serializeMapEntry(e,r,s,n){if(this.isIndexedValueInStack(r)){let a=this.getRefParam(r.i);if(this.markRef(e),this.isIndexedValueInStack(s)){let l=this.getRefParam(s.i);return this.createSetAssignment(e,a,l),""}if(s.t!==4&&s.i!=null&&this.isMarked(s.i)){let l="("+this.serialize(s)+",["+n+","+n+"])";return this.createSetAssignment(e,a,this.getRefParam(s.i)),this.createDeleteAssignment(e,n),l}let i=this.stack;return this.stack=[],this.createSetAssignment(e,a,this.serialize(s)),this.stack=i,""}if(this.isIndexedValueInStack(s)){let a=this.getRefParam(s.i);if(this.markRef(e),r.t!==4&&r.i!=null&&this.isMarked(r.i)){let l="("+this.serialize(r)+",["+n+","+n+"])";return this.createSetAssignment(e,this.getRefParam(r.i),a),this.createDeleteAssignment(e,n),l}let i=this.stack;return this.stack=[],this.createSetAssignment(e,this.serialize(r),a),this.stack=i,""}return "["+this.serialize(r)+","+this.serialize(s)+"]"}serializeMap(e){let r=zr,s=e.e.s,n=e.i,a=e.f,i=this.getRefParam(a.i);if(s){let l=e.e.k,c=e.e.v;this.stack.push(n);let d=this.serializeMapEntry(n,l[0],c[0],i);for(let h=1,H=d;h<s;h++)H=this.serializeMapEntry(n,l[h],c[h],i),d+=(H&&d&&",")+H;this.stack.pop(),d&&(r+="(["+d+"])");}return a.t===26&&(this.markRef(a.i),r="("+this.serialize(a)+","+r+")"),this.assignIndexedValue(n,r)}serializeArrayBuffer(e){let r="new Uint8Array(",s=e.s,n=s.length;if(n){r+="["+s[0];for(let a=1;a<n;a++)r+=","+s[a];r+="]";}return this.assignIndexedValue(e.i,r+").buffer")}serializeTypedArray(e){return this.assignIndexedValue(e.i,"new "+e.c+"("+this.serialize(e.f)+","+e.b+","+e.l+")")}serializeDataView(e){return this.assignIndexedValue(e.i,"new DataView("+this.serialize(e.f)+","+e.b+","+e.l+")")}serializeAggregateError(e){let r=e.i;this.stack.push(r);let s=this.serializeDictionary(e,'new AggregateError([],"'+e.m+'")');return this.stack.pop(),s}serializeError(e){return this.serializeDictionary(e,"new "+ce[e.s]+'("'+e.m+'")')}serializePromise(e){let r,s=e.f,n=e.i,a=e.s?Or:Tr;if(this.isIndexedValueInStack(s)){let i=this.getRefParam(s.i);r=a+(e.s?"().then("+this.createFunction([],i)+")":"().catch("+this.createEffectfulFunction([],"throw "+i)+")");}else {this.stack.push(n);let i=this.serialize(s);this.stack.pop(),r=a+"("+i+")";}return this.assignIndexedValue(n,r)}serializeWellKnownSymbol(e){return this.assignIndexedValue(e.i,$e[e.s])}serializeBoxed(e){return this.assignIndexedValue(e.i,"Object("+this.serialize(e.f)+")")}serializePlugin(e){let r=this.plugins;if(r)for(let s=0,n=r.length;s<n;s++){let a=r[s];if(a.tag===e.c)return this.assignIndexedValue(e.i,a.serialize(e.s,this,{id:e.i}))}throw new U(e.c)}getConstructor(e){let r=this.serialize(e);return r===this.getRefParam(e.i)?r:"("+r+")"}serializePromiseConstructor(e){return this.assignIndexedValue(e.i,this.getConstructor(e.f)+"()")}serializePromiseResolve(e){return this.getConstructor(e.a[0])+"("+this.getRefParam(e.i)+","+this.serialize(e.a[1])+")"}serializePromiseReject(e){return this.getConstructor(e.a[0])+"("+this.getRefParam(e.i)+","+this.serialize(e.a[1])+")"}serializeSpecialReferenceValue(e){switch(e){case 0:return "[]";case 1:return this.createFunction(["s","f","p"],"((p=new Promise("+this.createEffectfulFunction(["a","b"],"s=a,f=b")+")).s=s,p.f=f,p)");case 2:return this.createEffectfulFunction(["p","d"],'p.s(d),p.status="success",p.value=d;delete p.s;delete p.f');case 3:return this.createEffectfulFunction(["p","d"],'p.f(d),p.status="failure",p.value=d;delete p.s;delete p.f');case 4:return this.createFunction(["b","a","s","l","p","f","e","n"],"(b=[],a=!0,s=!1,l=[],p=0,f="+this.createEffectfulFunction(["v","m","x"],"for(x=0;x<p;x++)l[x]&&l[x][m](v)")+",n="+this.createEffectfulFunction(["o","x","z","c"],'for(x=0,z=b.length;x<z;x++)(c=b[x],(!a&&x===z-1)?o[s?"return":"throw"](c):o.next(c))')+",e="+this.createFunction(["o","t"],"(a&&(l[t=p++]=o),n(o),"+this.createEffectfulFunction([],"a&&(l[t]=void 0)")+")")+",{__SEROVAL_STREAM__:!0,on:"+this.createFunction(["o"],"e(o)")+",next:"+this.createEffectfulFunction(["v"],'a&&(b.push(v),f(v,"next"))')+",throw:"+this.createEffectfulFunction(["v"],'a&&(b.push(v),f(v,"throw"),a=s=!1,l.length=0)')+",return:"+this.createEffectfulFunction(["v"],'a&&(b.push(v),f(v,"return"),a=!1,s=!0,l.length=0)')+"})");case 5:return this.createFunction(["a","s"],"((s=(a=new AbortController).signal).a=a,s)");case 6:return this.createEffectfulFunction(["s","r"],"s.a.abort(r);delete s.a");default:return ""}}serializeSpecialReference(e){return this.assignIndexedValue(e.i,this.serializeSpecialReferenceValue(e.s))}serializeIteratorFactory(e){let r="",s=!1;return e.f.t!==4&&(this.markRef(e.f.i),r="("+this.serialize(e.f)+",",s=!0),r+=this.assignIndexedValue(e.i,this.createFunction(["s"],this.createFunction(["i","c","d","t"],"(i=0,t={["+this.getRefParam(e.f.i)+"]:"+this.createFunction([],"t")+",next:"+this.createEffectfulFunction([],"if(i>s.d)return{done:!0,value:void 0};if(d=s.v[c=i++],c===s.t)throw d;return{done:c===s.d,value:d}")+"})"))),s&&(r+=")"),r}serializeIteratorFactoryInstance(e){return this.getConstructor(e.a[0])+"("+this.serialize(e.a[1])+")"}serializeAsyncIteratorFactory(e){let r=e.a[0],s=e.a[1],n="";r.t!==4&&(this.markRef(r.i),n+="("+this.serialize(r)),s.t!==4&&(this.markRef(s.i),n+=(n?",":"(")+this.serialize(s)),n&&(n+=",");let a=this.assignIndexedValue(e.i,this.createFunction(["s"],this.createFunction(["b","c","p","d","e","t","f"],"(b=[],c=0,p=[],d=-1,e=!1,f="+this.createEffectfulFunction(["i","l"],"for(i=0,l=p.length;i<l;i++)p[i].s({done:!0,value:void 0})")+",s.on({next:"+this.createEffectfulFunction(["v","t"],"if(t=p.shift())t.s({done:!1,value:v});b.push(v)")+",throw:"+this.createEffectfulFunction(["v","t"],"if(t=p.shift())t.f(v);f(),d=b.length,e=!0,b.push(v)")+",return:"+this.createEffectfulFunction(["v","t"],"if(t=p.shift())t.s({done:!0,value:v});f(),d=b.length,b.push(v)")+"}),t={["+this.getRefParam(s.i)+"]:"+this.createFunction([],"t")+",next:"+this.createEffectfulFunction(["i","t","v"],"if(d===-1){return((i=c++)>=b.length)?(p.push(t="+this.getRefParam(r.i)+"()),t):{done:!1,value:b[i]}}if(c>d)return{done:!0,value:void 0};if(v=b[i=c++],i!==d)return{done:!1,value:v};if(e)throw v;return{done:!0,value:v}")+"})")));return n?n+a+")":a}serializeAsyncIteratorFactoryInstance(e){return this.getConstructor(e.a[0])+"("+this.serialize(e.a[1])+")"}serializeStreamConstructor(e){let r=this.assignIndexedValue(e.i,this.getConstructor(e.f)+"()"),s=e.a.length;if(s){let n=this.serialize(e.a[0]);for(let a=1;a<s;a++)n+=","+this.serialize(e.a[a]);return "("+r+","+n+","+this.getRefParam(e.i)+")"}return r}serializeStreamNext(e){return this.getRefParam(e.i)+".next("+this.serialize(e.f)+")"}serializeStreamThrow(e){return this.getRefParam(e.i)+".throw("+this.serialize(e.f)+")"}serializeStreamReturn(e){return this.getRefParam(e.i)+".return("+this.serialize(e.f)+")"}serializeAbortSignalSync(e){return this.assignIndexedValue(e.i,"AbortSignal.abort("+this.serialize(e.f)+")")}serializeAbortSignalConstructor(e){return this.assignIndexedValue(e.i,this.getConstructor(e.f)+"()")}serializeAbortSignalAbort(e){return this.getConstructor(e.a[0])+"("+this.getRefParam(e.i)+","+this.serialize(e.a[1])+")"}serialize(e){try{switch(e.t){case 2:return qe[e.s];case 0:return ""+e.s;case 1:return '"'+e.s+'"';case 3:return e.s+"n";case 4:return this.getRefParam(e.i);case 18:return this.serializeReference(e);case 9:return this.serializeArray(e);case 10:return this.serializeObject(e);case 11:return this.serializeNullConstructor(e);case 5:return this.serializeDate(e);case 6:return this.serializeRegExp(e);case 7:return this.serializeSet(e);case 8:return this.serializeMap(e);case 19:return this.serializeArrayBuffer(e);case 16:case 15:return this.serializeTypedArray(e);case 20:return this.serializeDataView(e);case 14:return this.serializeAggregateError(e);case 13:return this.serializeError(e);case 12:return this.serializePromise(e);case 17:return this.serializeWellKnownSymbol(e);case 21:return this.serializeBoxed(e);case 22:return this.serializePromiseConstructor(e);case 23:return this.serializePromiseResolve(e);case 24:return this.serializePromiseReject(e);case 25:return this.serializePlugin(e);case 26:return this.serializeSpecialReference(e);case 27:return this.serializeIteratorFactory(e);case 28:return this.serializeIteratorFactoryInstance(e);case 29:return this.serializeAsyncIteratorFactory(e);case 30:return this.serializeAsyncIteratorFactoryInstance(e);case 31:return this.serializeStreamConstructor(e);case 32:return this.serializeStreamNext(e);case 33:return this.serializeStreamThrow(e);case 34:return this.serializeStreamReturn(e);case 36:return this.serializeAbortSignalAbort(e);case 35:return this.serializeAbortSignalConstructor(e);case 37:return this.serializeAbortSignalSync(e);default:throw new g$1(e)}}catch(r){throw new ze(r)}}};var T=class extends O$1{constructor(r){super(r);this.mode="cross";this.scopeId=r.scopeId;}getRefParam(r){return Z$1+"["+r+"]"}assignIndexedValue(r,s){return this.getRefParam(r)+"="+s}serializeTop(r){let s=this.serialize(r),n=r.i;if(n==null)return s;let a=this.resolvePatches(),i=this.getRefParam(n),l=this.scopeId==null?"":Z$1,c=a?"("+s+","+a+i+")":s;if(l==="")return r.t===10&&!a?"("+c+")":c;let d=this.scopeId==null?"()":"("+Z$1+'["'+p$1(this.scopeId)+'"])';return "("+this.createFunction([l],c)+")"+d}};var N=class extends K$1{parseItems(e){let r=[];for(let s=0,n=e.length;s<n;s++)s in e&&(r[s]=this.parse(e[s]));return r}parseArray(e,r){return ve(e,r,this.parseItems(r))}parseProperties(e){let r=Object.entries(e),s=[],n=[];for(let i=0,l=r.length;i<l;i++)s.push(p$1(r[i][0])),n.push(this.parse(r[i][1]));let a=Symbol.iterator;return a in e&&(s.push(this.parseWellKnownSymbol(a)),n.push(B$1(this.parseIteratorFactory(),this.parse(W(e))))),a=Symbol.asyncIterator,a in e&&(s.push(this.parseWellKnownSymbol(a)),n.push(j(this.parseAsyncIteratorFactory(),this.parse(L$1())))),a=Symbol.toStringTag,a in e&&(s.push(this.parseWellKnownSymbol(a)),n.push(w(e[a]))),a=Symbol.isConcatSpreadable,a in e&&(s.push(this.parseWellKnownSymbol(a)),n.push(e[a]?x$1:I$1)),{k:s,v:n,s:s.length}}parsePlainObject(e,r,s){return this.createObjectNode(e,r,s,this.parseProperties(r))}parseBoxed(e,r){return Ne(e,this.parse(r.valueOf()))}parseTypedArray(e,r){return be(e,r,this.parse(r.buffer))}parseBigIntTypedArray(e,r){return Ae(e,r,this.parse(r.buffer))}parseDataView(e,r){return xe(e,r,this.parse(r.buffer))}parseError(e,r){let s=V$1(r,this.features);return Ie(e,r,s?this.parseProperties(s):t)}parseAggregateError(e,r){let s=V$1(r,this.features);return we(e,r,s?this.parseProperties(s):t)}parseMap(e,r){let s=[],n=[];for(let[a,i]of r.entries())s.push(this.parse(a)),n.push(this.parse(i));return this.createMapNode(e,s,n,r.size)}parseSet(e,r){let s=[];for(let n of r.keys())s.push(this.parse(n));return Ee(e,r.size,s)}parsePlugin(e,r){let s=this.plugins;if(s)for(let n=0,a=s.length;n<a;n++){let i=s[n];if(i.parse.sync&&i.test(r))return D(e,i.tag,i.parse.sync(r,this,{id:e}))}}parseStream(e,r){return _$1(e,this.parseSpecialReference(4),[])}parsePromise(e,r){return this.createPromiseConstructorNode(e)}parseAbortSignalSync(e,r){return u$1(37,e,t,t,t,t,t,t,t,this.parse(r.reason),t,t)}parseAbortSignal(e,r){return r.aborted?this.parseAbortSignalSync(e,r):this.createAbortSignalConstructorNode(e)}parseObject(e,r){if(Array.isArray(r))return this.parseArray(e,r);if(ke(r))return this.parseStream(e,r);let s=r.constructor;if(s===P)return this.parse(r.replacement);let n=this.parsePlugin(e,r);if(n)return n;switch(s){case Object:return this.parsePlainObject(e,r,!1);case void 0:return this.parsePlainObject(e,r,!0);case Date:return ge(e,r);case RegExp:return he(e,r);case Error:case EvalError:case RangeError:case ReferenceError:case SyntaxError:case TypeError:case URIError:return this.parseError(e,r);case Number:case Boolean:case String:case BigInt:return this.parseBoxed(e,r);case ArrayBuffer:return ye(e,r);case Int8Array:case Int16Array:case Int32Array:case Uint8Array:case Uint16Array:case Uint32Array:case Uint8ClampedArray:case Float32Array:case Float64Array:return this.parseTypedArray(e,r);case DataView:return this.parseDataView(e,r);case Map:return this.parseMap(e,r);case Set:return this.parseSet(e,r);}if(s===Promise||r instanceof Promise)return this.parsePromise(e,r);let a=this.features;if(a&32&&typeof AbortSignal!="undefined"&&s===AbortSignal)return this.parseAbortSignal(e,r);if(a&16)switch(s){case BigInt64Array:case BigUint64Array:return this.parseBigIntTypedArray(e,r);}if(a&1&&typeof AggregateError!="undefined"&&(s===AggregateError||r instanceof AggregateError))return this.parseAggregateError(e,r);if(r instanceof Error)return this.parseError(e,r);if(Symbol.iterator in r||Symbol.asyncIterator in r)return this.parsePlainObject(e,r,!!s);throw new S$1(r)}parse(e){try{switch(typeof e){case"boolean":return e?x$1:I$1;case"undefined":return ue;case"string":return w(e);case"number":return me(e);case"bigint":return Se(e);case"object":{if(e){let r=this.getReference(e);return r.type===0?this.parseObject(r.value,e):r.value}return de}case"symbol":return this.parseWellKnownSymbol(e);case"function":return this.parseFunction(e);default:throw new S$1(e)}}catch(r){throw new M$1(r)}}};var te$1=class te extends N{constructor(r){super(r);this.alive=!0;this.pending=0;this.initial=!0;this.buffer=[];this.onParseCallback=r.onParse,this.onErrorCallback=r.onError,this.onDoneCallback=r.onDone;}onParseInternal(r,s){try{this.onParseCallback(r,s);}catch(n){this.onError(n);}}flush(){for(let r=0,s=this.buffer.length;r<s;r++)this.onParseInternal(this.buffer[r],!1);}onParse(r){this.initial?this.buffer.push(r):this.onParseInternal(r,!1);}onError(r){if(this.onErrorCallback)this.onErrorCallback(r);else throw r}onDone(){this.onDoneCallback&&this.onDoneCallback();}pushPendingState(){this.pending++;}popPendingState(){--this.pending<=0&&this.onDone();}parseProperties(r){let s=Object.entries(r),n=[],a=[];for(let l=0,c=s.length;l<c;l++)n.push(p$1(s[l][0])),a.push(this.parse(s[l][1]));let i=Symbol.iterator;return i in r&&(n.push(this.parseWellKnownSymbol(i)),a.push(B$1(this.parseIteratorFactory(),this.parse(W(r))))),i=Symbol.asyncIterator,i in r&&(n.push(this.parseWellKnownSymbol(i)),a.push(j(this.parseAsyncIteratorFactory(),this.parse(Fe(r))))),i=Symbol.toStringTag,i in r&&(n.push(this.parseWellKnownSymbol(i)),a.push(w(r[i]))),i=Symbol.isConcatSpreadable,i in r&&(n.push(this.parseWellKnownSymbol(i)),a.push(r[i]?x$1:I$1)),{k:n,v:a,s:n.length}}parsePromise(r,s){return s.then(n=>{let a=this.parseWithError(n);a&&this.onParse(u$1(23,r,t,t,t,t,t,t,[this.parseSpecialReference(2),a],t,t,t)),this.popPendingState();},n=>{if(this.alive){let a=this.parseWithError(n);a&&this.onParse(u$1(24,r,t,t,t,t,t,t,[this.parseSpecialReference(3),a],t,t,t));}this.popPendingState();}),this.pushPendingState(),this.createPromiseConstructorNode(r)}parsePlugin(r,s){let n=this.plugins;if(n)for(let a=0,i=n.length;a<i;a++){let l=n[a];if(l.parse.stream&&l.test(s))return D(r,l.tag,l.parse.stream(s,this,{id:r}))}return t}parseStream(r,s){let n=_$1(r,this.parseSpecialReference(4),[]);return this.pushPendingState(),s.on({next:a=>{if(this.alive){let i=this.parseWithError(a);i&&this.onParse(Re(r,i));}},throw:a=>{if(this.alive){let i=this.parseWithError(a);i&&this.onParse(Pe(r,i));}this.popPendingState();},return:a=>{if(this.alive){let i=this.parseWithError(a);i&&this.onParse(Ce(r,i));}this.popPendingState();}}),n}parseAbortSignal(r,s){return s.aborted?this.parseAbortSignalSync(r,s):(this.pushPendingState(),s.addEventListener("abort",()=>{if(this.alive){let n=this.parseWithError(s.reason);n&&this.onParse(u$1(36,r,t,t,t,t,t,t,[this.parseSpecialReference(6),n],t,t,t));}this.popPendingState();},{once:!0}),this.createAbortSignalConstructorNode(r))}parseWithError(r){try{return this.parse(r)}catch(s){return this.onError(s),t}}start(r){let s=this.parseWithError(r);s&&(this.onParseInternal(s,!0),this.initial=!1,this.flush(),this.pending<=0&&this.destroy());}destroy(){this.alive&&(this.onDone(),this.alive=!1);}isAlive(){return this.alive}};var Y=class extends te$1{constructor(){super(...arguments);this.mode="cross";}};function fr(o,e){let r=f$1(e.plugins),s=new Y({plugins:r,refs:e.refs,disabledFeatures:e.disabledFeatures,onParse(n,a){let i=new T({plugins:r,features:s.features,scopeId:e.scopeId,markedRefs:s.marked}),l;try{l=i.serializeTop(n);}catch(c){e.onError&&e.onError(c);return}e.onSerialize(l,a);},onError:e.onError,onDone:e.onDone});return s.start(o),()=>{s.destroy();}}var De=class{constructor(e){this.options=e;this.alive=!0;this.flushed=!1;this.done=!1;this.pending=0;this.cleanups=[];this.refs=new Map;this.keys=new Set;this.ids=0;this.plugins=f$1(e.plugins);}write(e,r){this.alive&&!this.flushed&&(this.pending++,this.keys.add(e),this.cleanups.push(fr(r,{plugins:this.plugins,scopeId:this.options.scopeId,refs:this.refs,disabledFeatures:this.options.disabledFeatures,onError:this.options.onError,onSerialize:(s,n)=>{this.alive&&this.options.onData(n?this.options.globalIdentifier+'["'+p$1(e)+'"]='+s:s);},onDone:()=>{this.alive&&(this.pending--,this.pending<=0&&this.flushed&&!this.done&&this.options.onDone&&(this.options.onDone(),this.done=!0));}})));}getNextID(){for(;this.keys.has(""+this.ids);)this.ids++;return ""+this.ids}push(e){let r=this.getNextID();return this.write(r,e),r}flush(){this.alive&&(this.flushed=!0,this.pending<=0&&!this.done&&this.options.onDone&&(this.options.onDone(),this.done=!0));}close(){if(this.alive){for(let e=0,r=this.cleanups.length;e<r;e++)this.cleanups[e]();!this.done&&this.options.onDone&&(this.options.onDone(),this.done=!0),this.alive=!1;}}};

function p(e){return {detail:e.detail,bubbles:e.bubbles,cancelable:e.cancelable,composed:e.composed}}var E=Wr({tag:"seroval-plugins/web/CustomEvent",test(e){return typeof CustomEvent=="undefined"?!1:e instanceof CustomEvent},parse:{sync(e,r){return {type:r.parse(e.type),options:r.parse(p(e))}},async async(e,r){return {type:await r.parse(e.type),options:await r.parse(p(e))}},stream(e,r){return {type:r.parse(e.type),options:r.parse(p(e))}}},serialize(e,r){return "new CustomEvent("+r.serialize(e.type)+","+r.serialize(e.options)+")"},deserialize(e,r){return new CustomEvent(r.deserialize(e.type),r.deserialize(e.options))}}),F=E;var I=Wr({tag:"seroval-plugins/web/DOMException",test(e){return typeof DOMException=="undefined"?!1:e instanceof DOMException},parse:{sync(e,r){return {name:r.parse(e.name),message:r.parse(e.message)}},async async(e,r){return {name:await r.parse(e.name),message:await r.parse(e.message)}},stream(e,r){return {name:r.parse(e.name),message:r.parse(e.message)}}},serialize(e,r){return "new DOMException("+r.serialize(e.message)+","+r.serialize(e.name)+")"},deserialize(e,r){return new DOMException(r.deserialize(e.message),r.deserialize(e.name))}}),B=I;function u(e){return {bubbles:e.bubbles,cancelable:e.cancelable,composed:e.composed}}var L=Wr({tag:"seroval-plugins/web/Event",test(e){return typeof Event=="undefined"?!1:e instanceof Event},parse:{sync(e,r){return {type:r.parse(e.type),options:r.parse(u(e))}},async async(e,r){return {type:await r.parse(e.type),options:await r.parse(u(e))}},stream(e,r){return {type:r.parse(e.type),options:r.parse(u(e))}}},serialize(e,r){return "new Event("+r.serialize(e.type)+","+r.serialize(e.options)+")"},deserialize(e,r){return new Event(r.deserialize(e.type),r.deserialize(e.options))}}),O=L;var q=Wr({tag:"seroval-plugins/web/File",test(e){return typeof File=="undefined"?!1:e instanceof File},parse:{async async(e,r){return {name:await r.parse(e.name),options:await r.parse({type:e.type,lastModified:e.lastModified}),buffer:await r.parse(await e.arrayBuffer())}}},serialize(e,r){return "new File(["+r.serialize(e.buffer)+"],"+r.serialize(e.name)+","+r.serialize(e.options)+")"},deserialize(e,r){return new File([r.deserialize(e.buffer)],r.deserialize(e.name),r.deserialize(e.options))}}),d=q;function f(e){let r=[];return e.forEach((s,a)=>{r.push([a,s]);}),r}var n={},H=Wr({tag:"seroval-plugins/web/FormDataFactory",test(e){return e===n},parse:{sync(){},async async(){return await Promise.resolve(void 0)},stream(){}},serialize(e,r){return r.createEffectfulFunction(["e","f","i","s","t"],"f=new FormData;for(i=0,s=e.length;i<s;i++)f.append((t=e[i])[0],t[1]);return f")},deserialize(){return n}}),M=Wr({tag:"seroval-plugins/web/FormData",extends:[d,H],test(e){return typeof FormData=="undefined"?!1:e instanceof FormData},parse:{sync(e,r){return {factory:r.parse(n),entries:r.parse(f(e))}},async async(e,r){return {factory:await r.parse(n),entries:await r.parse(f(e))}},stream(e,r){return {factory:r.parse(n),entries:r.parse(f(e))}}},serialize(e,r){return "("+r.serialize(e.factory)+")("+r.serialize(e.entries)+")"},deserialize(e,r){let s=new FormData,a=r.deserialize(e.entries);for(let t=0,b=a.length;t<b;t++){let c=a[t];s.append(c[0],c[1]);}return s}}),A=M;function m(e){let r=[];return e.forEach((s,a)=>{r.push([a,s]);}),r}var _=Wr({tag:"seroval-plugins/web/Headers",test(e){return typeof Headers=="undefined"?!1:e instanceof Headers},parse:{sync(e,r){return r.parse(m(e))},async async(e,r){return await r.parse(m(e))},stream(e,r){return r.parse(m(e))}},serialize(e,r){return "new Headers("+r.serialize(e)+")"},deserialize(e,r){return new Headers(r.deserialize(e))}}),i=_;var o={},V=Wr({tag:"seroval-plugins/web/ReadableStreamFactory",test(e){return e===o},parse:{sync(){},async async(){return await Promise.resolve(void 0)},stream(){}},serialize(e,r){return r.createFunction(["d"],"new ReadableStream({start:"+r.createEffectfulFunction(["c"],"d.on({next:"+r.createEffectfulFunction(["v"],"c.enqueue(v)")+",throw:"+r.createEffectfulFunction(["v"],"c.error(v)")+",return:"+r.createEffectfulFunction([],"c.close()")+"})")+"})")},deserialize(){return o}});function g(e){let r=L$1(),s=e.getReader();async function a(){try{let t=await s.read();t.done?r.return(t.value):(r.next(t.value),await a());}catch(t){r.throw(t);}}return a().catch(()=>{}),r}var G=Wr({tag:"seroval/plugins/web/ReadableStream",extends:[V],test(e){return typeof ReadableStream=="undefined"?!1:e instanceof ReadableStream},parse:{sync(e,r){return {factory:r.parse(o),stream:r.parse(L$1())}},async async(e,r){return {factory:await r.parse(o),stream:await r.parse(g(e))}},stream(e,r){return {factory:r.parse(o),stream:r.parse(g(e))}}},serialize(e,r){return "("+r.serialize(e.factory)+")("+r.serialize(e.stream)+")"},deserialize(e,r){let s=r.deserialize(e.stream);return new ReadableStream({start(a){s.on({next(t){a.enqueue(t);},throw(t){a.error(t);},return(){a.close();}});}})}}),l=G;function z(e,r){return {body:r,cache:e.cache,credentials:e.credentials,headers:e.headers,integrity:e.integrity,keepalive:e.keepalive,method:e.method,mode:e.mode,redirect:e.redirect,referrer:e.referrer,referrerPolicy:e.referrerPolicy}}var K=Wr({tag:"seroval-plugins/web/Request",extends:[l,i],test(e){return typeof Request=="undefined"?!1:e instanceof Request},parse:{async async(e,r){return {url:await r.parse(e.url),options:await r.parse(z(e,e.body?await e.clone().arrayBuffer():null))}},stream(e,r){return {url:r.parse(e.url),options:r.parse(z(e,e.clone().body))}}},serialize(e,r){return "new Request("+r.serialize(e.url)+","+r.serialize(e.options)+")"},deserialize(e,r){return new Request(r.deserialize(e.url),r.deserialize(e.options))}}),Q=K;function S(e){return {headers:e.headers,status:e.status,statusText:e.statusText}}var X=Wr({tag:"seroval-plugins/web/Response",extends:[l,i],test(e){return typeof Response=="undefined"?!1:e instanceof Response},parse:{async async(e,r){return {body:await r.parse(e.body?await e.clone().arrayBuffer():null),options:await r.parse(S(e))}},stream(e,r){return {body:r.parse(e.clone().body),options:r.parse(S(e))}}},serialize(e,r){return "new Response("+r.serialize(e.body)+","+r.serialize(e.options)+")"},deserialize(e,r){return new Response(r.deserialize(e.body),r.deserialize(e.options))}}),Z=X;var x=Wr({tag:"seroval-plugins/web/URLSearchParams",test(e){return typeof URLSearchParams=="undefined"?!1:e instanceof URLSearchParams},parse:{sync(e,r){return r.parse(e.toString())},async async(e,r){return await r.parse(e.toString())},stream(e,r){return r.parse(e.toString())}},serialize(e,r){return "new URLSearchParams("+r.serialize(e)+")"},deserialize(e,r){return new URLSearchParams(r.deserialize(e))}}),ee=x;var ae=Wr({tag:"seroval-plugins/web/URL",test(e){return typeof URL=="undefined"?!1:e instanceof URL},parse:{sync(e,r){return r.parse(e.href)},async async(e,r){return await r.parse(e.href)},stream(e,r){return r.parse(e.href)}},serialize(e,r){return "new URL("+r.serialize(e)+")"},deserialize(e,r){return new URL(r.deserialize(e))}}),te=ae;

const booleans = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "hidden",
  "indeterminate",
  "inert",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected"
];
const BooleanAttributes = /*#__PURE__*/ new Set(booleans);
const ChildProperties = /*#__PURE__*/ new Set([
  "innerHTML",
  "textContent",
  "innerText",
  "children"
]);
const Aliases = /*#__PURE__*/ Object.assign(Object.create(null), {
  className: "class",
  htmlFor: "for"
});

const ES2017FLAG = F$1.AggregateError | F$1.BigIntTypedArray;
const GLOBAL_IDENTIFIER = "_$HY.r";
function createSerializer({ onData, onDone, scopeId, onError }) {
  return new De({
    scopeId,
    plugins: [
      F,
      B,
      O,
      A,
      i,
      l,
      Q,
      Z,
      ee,
      te
    ],
    globalIdentifier: GLOBAL_IDENTIFIER,
    disabledFeatures: ES2017FLAG,
    onData,
    onDone,
    onError
  });
}
function getLocalHeaderScript(id) {
  return Nr(id) + ";";
}

const VOID_ELEMENTS =
  /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;
const REPLACE_SCRIPT = `function $df(e,n,o,t){if(n=document.getElementById(e),o=document.getElementById("pl-"+e)){for(;o&&8!==o.nodeType&&o.nodeValue!=="pl-"+e;)t=o.nextSibling,o.remove(),o=t;_$HY.done?o.remove():o.replaceWith(n.content)}n.remove(),_$HY.fe(e)}`;
function renderToStringAsync(code, options = {}) {
  const { timeoutMs = 30000 } = options;
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
  let { nonce, onCompleteShell, onCompleteAll, renderId, noScripts } = options;
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
    onCompleteAll &&
      onCompleteAll({
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
      html =
        html.slice(0, first) +
        resolveSSRNode(escape(payloadFn())) +
        html.slice(last + placeholder.length + 1);
    },
    serialize(id, p, wait) {
      const serverOnly = sharedConfig.context.noHydrate;
      if (!firstFlushed && wait && typeof p === "object" && "then" in p) {
        blockingPromises.push(p);
        !serverOnly &&
          p
            .then(d => {
              serializer.write(id, d);
            })
            .catch(e => {
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
        const p = new Promise((r, rej) => ((resolve = r), (reject = rej)));
        registry.set(key, err =>
          queue(() =>
            queue(() => {
              err ? reject(err) : resolve(true);
              queue(flushEnd);
            })
          )
        );
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
              queue(() => (html = replacePlaceholder(html, key, value !== undefined ? value : "")));
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
    onCompleteShell &&
      onCompleteShell({
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
        const p = new Promise(r => (resolve = r));
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
  const { nonce } = sharedConfig.context;
  return ssr(
    generateHydrationScript({
      nonce,
      ...props
    })
  );
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
  if (props == null) props = {};
  else if (typeof props === "function") props = props();
  const skipChildren = VOID_ELEMENTS.test(tag);
  const keys = Object.keys(props);
  let result = `<${tag}${needsId ? ssrHydrationKey() : ""} `;
  let classResolved;
  for (let i = 0; i < keys.length; i++) {
    const prop = keys[i];
    if (ChildProperties.has(prop)) {
      if (children === undefined && !skipChildren)
        children = prop === "innerHTML" ? props[prop] : escape(props[prop]);
      continue;
    }
    const value = props[prop];
    if (prop === "style") {
      result += `style="${ssrStyle(value)}"`;
    } else if (prop === "class" || prop === "className" || prop === "classList") {
      if (classResolved) continue;
      let n;
      result += `class="${
        escape(((n = props.class) ? n + " " : "") + ((n = props.className) ? n + " " : ""), true) +
        ssrClassList(props.classList)
      }"`;
      classResolved = true;
    } else if (BooleanAttributes.has(prop)) {
      if (value) result += prop;
      else continue;
    } else if (
      value == undefined ||
      prop === "ref" ||
      prop.slice(0, 2) === "on" ||
      prop.slice(0, 5) === "prop:"
    ) {
      continue;
    } else if (prop.slice(0, 5) === "bool:") {
      if (!value) continue;
      result += escape(prop.slice(5));
    } else if (prop.slice(0, 5) === "attr:") {
      result += `${escape(prop.slice(5))}="${escape(value, true)}"`;
    } else {
      result += `${Aliases[prop] || escape(prop)}="${escape(value, true)}"`;
    }
    if (i !== keys.length - 1) result += " ";
  }
  if (skipChildren)
    return {
      t: result + "/>"
    };
  if (typeof children === "function") children = children();
  return {
    t: result + `>${resolveSSRNode(children, true)}</${tag}>`
  };
}
function ssrAttribute(key, value, isBoolean) {
  return isBoolean ? (value ? " " + key : "") : value != null ? ` ${key}="${value}"` : "";
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
  } else
    while (iAmp >= 0) {
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
      mapped += resolveSSRNode((prev = node[i]));
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
  sharedConfig.context.assets.push(() => resolveSSRNode(escape(fn())));
}
function generateHydrationScript({ eventNames = ["click", "input"], nonce } = {}) {
  return `<script${
    nonce ? ` nonce="${nonce}"` : ""
  }>window._$HY||(e=>{let t=e=>e&&e.hasAttribute&&(e.hasAttribute("data-hk")?e:t(e.host&&e.host.nodeType?e.host:e.parentNode));["${eventNames.join(
    '", "'
  )}"].forEach((o=>document.addEventListener(o,(o=>{if(!e.events)return;let s=t(o.composedPath&&o.composedPath()[0]||o.target);s&&!e.completed.has(s)&&e.events.push([s,o])}))))})(_$HY={events:[],completed:new WeakSet,r:{},fe(){}});</script><!--xs-->`;
}
function NoHydration(props) {
  if (sharedConfig.context) sharedConfig.context.noHydrate = true;
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
  const index = html.indexOf("</head>");
  if (index === -1) return html;
  return html.slice(0, index) + out + html.slice(index);
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
  return (
    obj != null &&
    typeof obj === "object" &&
    (Object.getPrototypeOf(obj) === Object.prototype || Array.isArray(obj))
  );
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
      const { from = 0, to = current.length - 1, by = 1 } = part;
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
  if (part === undefined || (isWrappable(next) && isWrappable(value) && !Array.isArray(value))) {
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
