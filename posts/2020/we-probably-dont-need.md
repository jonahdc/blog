---
title: We probably don’t need our own interfaces for redux actions.
date: 2020-01-18
excerpt: When TypeScript complained about then , I dove into Conditional Types and probably we don’t need actions interfaces.
tags: [Typescript, React, Redux]
---

_When TypeScript complained about _`then`_, I dove into Conditional Types and probably we don’t need actions interfaces._

In my `actions.ts` file, I would usually write the function implementations and at the bottom I would define an interface which is a copy-paste exercise of the function names and their respective types using `typeof`. It looks like the following:

    // actions.ts

    // Your typical action creator
    export function funA(id: number) {
      return {
        type: 'FUN_A',
        payload: {
          id,
        },
      };
    }

    // A thunk action creator
    export function funThunkB(id: number, data: object) {
      return (dispatch: ThunkDispatch<IStoreState, void, Action>, getState) => {
        return ApiService.post(endpoint, { data });
      };
    }
    //... and other action creators / thunks implementation

    // Then this comes at the bottom to define the types.
    export interface IMyActions extends ActionCreatorsMapObject {
      funA: typeof funA;
      funThunkB: typeof funThunkB;
    }

Once I have the actions interface defined and exported, in the Component/Container, I might have a way to assign that interface probably like this:

    // MyComponent.tsx

    interface MyComponentProps {
      actions: IMyActions; // imported from actions.ts
    }
    export class MyComponent extends React.Component<MyComponentProps> { ... }

Then further down below `MyComponent` class, we write our usual `mapDispatchToProps` to bind our imported `actions` to `dispatch` with `bindActionCreators`. We can now call them as we normally would:

    this.props.actions.funA(id);
    ...
    this.props.actions.funThunkB(id, anObject).then(res => {
    	// Do anything here about `res` or show a toaster saying 'Success'
    });

This approach looks and will work fine. TypeScript will tell you that `actions` has `funA` and `funThunkB` available actions and your choice of IDE will likely have a popup listing them down. The `funA` call is type-checked properly and will neatly tell you it’s expected to return an object of type `{ type: string, payload: { id: number }}`.

But soon enough we’ll find a couple of things off:
(1) First, TypeScript complains when using `then` on  `this.props.actions.funThunkB`

    Property 'then' does not exist on type '(dispatch: ThunkDispatch<IStoreState, void, Action<any>>, getState: any) => Promise<void>'

A red-squiggle on `then` appears on `this.props.actions.funThunkB(id, anObject).then(...)`
(2) Second, it feels like the whole copy-paste exercise in `interface IMyActions` is redundant.

### TypeScript complains about `then`

Looking at the `then` error, we find that it’s actually reasonable. As you recall we have this in our `actions.ts` file:

    funThunkB: typeof funThunkB;

And that is equivalent to the following:

    funThunkB: (id: number, data: object) => (dispatch: ThunkDispatch<IStoreState, void, Action<any>>, getState: any) => Promise<void>

So `then` definitely doesn’t exist in its return type  `(dispatch: ThunkDispatch<IStoreState, void, Action<any>>, getState: any) => Promise<void>`.

Now how do we use `then`  without TypeScript complaining? By telling it that the return type is a `Promise`. But in order to do that, we need a way to define `funThunkB` as `(id: number, data: object) => Promise<void>`, only then TypeScript will keep quiet.

The good news is `redux-thunk` is on the way to do that for us. It has a yet-to-be-released tweak to its `index.d.ts` to include a conditional type so that it also infers `ThunkAction` return types.

> As per [#223](https://github.com/reduxjs/redux-thunk/issues/223), redux's `bindActionCreators` only works nicely for standard action creators. This implementation infers the return type of ThunkActions so the application could respond accordingly...
>
> - RMHonor [https://github.com/RMHonor](https://github.com/RMHonor) at [https://github.com/reduxjs/redux-thunk/pull/224/files#diff-b52768974e6bc0faccb7d4b75b162c99R45](https://github.com/reduxjs/redux-thunk/pull/224/files#diff-b52768974e6bc0faccb7d4b75b162c99R45)

Extracting from that PR, the addition is the following:

    function bindActionCreators<M extends ActionCreatorsMapObject<any>>(
      actionCreators: M,
      dispatch: Dispatch)
    {
      [N in keyof M]: ReturnType<M[N]> extends ThunkAction<any, any, any, any> ? (...args: Parameters<M[N]>) => ReturnType<ReturnType<M[N]>> : M[N]
    }

[https://github.com/reduxjs/redux-thunk/pull/224/files#diff-b52768974e6bc0faccb7d4b75b162c99R45](https://github.com/reduxjs/redux-thunk/pull/224/files#diff-b52768974e6bc0faccb7d4b75b162c99R45)
This means `bindActionCreators` returns an object of actions which are conditionally typed ([Conditional Types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#conditional-types)).

Let's break that down by splitting it to two parts: (A) `actionCreators` parameter and (B) the main part:

    [N in keyof M]: ReturnType<M[N]> extends ThunkAction<any, any, any, any> ? (...args: Parameters<M[N]>) => ReturnType<ReturnType<M[N]>> : M[N] (A)

(A) The `actionCreators` is where the imported `actions` is supplied and it is of type `M` which extends `ActionCreatorsMapObject`. `ActionCreatorsMapObject` is just a key-value pair mapping of function names to their types just as `IMyActions` is.

When the import of `actions` happens, we get an object of `actions` like this:

    {
      funA: function (id) {
        ...
      },
      funThunkB: function(id, data) {
        ...
      },
    }

And when the `actions` object is passed into `bindActionsCreators` in the `actionCreators` parameter, inferred type `M` refers to the following.

    {
    	funA: (id: number) => { type: string; payload: { id: number } };
    	funThunkB: (
      		id: number,
      		data: object
    	) => (dispatch: ThunkDispatch<IStoreState, void, Action<any>>, getState: any) => Promise<void>;
    }

(B) Now that we have some ideas of what `M` type is, let’s look at the conditional type again:

    [N in keyof M]: ReturnType<M[N]> extends ThunkAction<any, any, any, any> ? (...args: Parameters<M[N]>) => ReturnType<ReturnType<M[N]>> : M[N]

In `[N in keyof M]`,  `N` refers to the function names that are keys of the actions object of type `M`.  So `M[N]` is referring to the type of the value — for example, the type of the value for key `funA` is:

    (id: number) => { type: string; payload: { id: number }};

`M[N]` of `funA`
The `ReturnType<M[N]>` then points to its the return type:

    { type: string; payload: { id: number } };

`ReturnType<M[N]>` of `funA`
So with this pattern in mind, let’s look at the condition `ReturnType<M[N]> extends ThunkAction<any, any, any, any>`. This condition checks if the return type extends `ThunkAction` type. Quite simply, if this is false it means it’s a standard action creator and its type shall remain `M[N]` – `funA` is a standard action creator and its type remains `{ type: string; payload: { id: number } };`.

What then happens if the return type extends `ThunkAction` and is therefore not a standard action creator? In this case, we infer the return type of the return type to be the return type of the inferred type of the value. To illustrate that, let’s go back to the type definition of  `funThunkB`:

    funThunkB: (id: number, data: object) => (dispatch: ThunkDispatch<IStoreState, void, Action<any>>, getState: any) => Promise<void>

`M[N]` is the type of the value given the property `N`. In the case of `funThunkB`, `M[N]` is:

    (id: number, data: object) => (dispatch: ThunkDispatch<IStoreState, void, Action<any>>, getState: any) => Promise<void>

Following that, `ReturnType<M[N]>` is:

    (dispatch: ThunkDispatch<IStoreState, void, Action<any>>, getState: any) => Promise<void>

Which makes `ReturnType<ReturnType<M[N]>`:

    Promise<void>

Now circling back to `redux-thunk`’s conditional type: If `ReturnType<M[N]> extends ThunkAction<any, any, any, any>` condition is true, the type will then become `(...args: Parameters<M[N]>) => ReturnType<ReturnType<M[N]>>`.  So for `funThunkB`, `(...args: Parameters<M[N]>)` is `(id: number, data: object)` and as we’ve seen above `ReturnType<ReturnType<M[N]>>` is `Promise<void>`.

`bindActionCreators` therefore returns a type that looks roughly like the following:

    {
    	funA: (id: number) => { type: string; payload: { id: number } };
    	funThunkB: (id: number, data: object) => Promise<void>; // This is what we want
    }

TypeScript infers that a `funThunkB` now returns a `Promise` :tada:
What’s the implication? It simply means `bindActionCreators` is able to derive the accurate types of the actions for both standard and thunk action creators we access the actions within our components.

So back to `MyComponent`, we have:

    // MyComponent.tsx
    ...

    function mapDispatchToProps(dispatch) {
    	return {
        	actions: bindActionCreators(actions, dispatch) // actions imported
        }
    }

Now we need to be able to access the action types from the `bindActionCreators` in the `mapDispatchToProps`.

When we get the type of `mapDispatchToProps` using `typeof` we infer the following:

    (dispatch: any) => {
    	actions: {
            funA: (id: number) => { type: string; payload: { id: number } };
            funThunkB: (id: number, data: object) => Promise<void>; // This is what we want
        }
    }

`typeof mapDispatchToProps`
This makes `ReturnType<typeof mapDispatchToProps>` the following:

    {
        actions: {
            funA: (id: number) => { type: string; payload: { id: number } };
            funThunkB: (id: number, data: object) => Promise<void>;
            }
        }
    }

`ReturnType<typeof mapDispatchToProps>`
Then in our class definition we add that as part of our component props .

    export class MyComponent extends React.Component<MyComponentProps & ReturnType<typeof matchDispatchToProps>>

This then would allow us to access all the types of the action creators including the thunks. And of course, TypeScript now learns what we're trying to do and the `then` red-squiggle disappears because we have typed the thunk action creators like `funThunkB` to have a return type  `Promise`. The current version at the time of this writing is `redux-thunk@2.3.0`  and it has yet to include the new `bindActionCreators` type that we need. Until the update is released, one can copy the new `index.d.ts` to override the existing types.

### Using actions interfaces feels redundant

This brings me to my second point that action interfaces like `IMyActions` to type our redux actions may be redundant. In my opinion, if we’re not using `IMyActions` type anywhere else other than in the context of using them within our components, it may be possible to do away with them and let `bindActionCreators` derive the types as they are imported. This way, you still get the type checks while not expanding the codebase with extra types and interfaces to maintain.
