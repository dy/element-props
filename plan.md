# plan

* [ ] integrate into templize
* [ ] integrate into hyperf

* [ ] make separate prop(el, name, value) method, robustly setting prop - needed separately

* [ ] staticify amap

* [x] remove observable:
  + must be weakref-based to avoid mem leaks;
  + heavy to spawn massive events, better observe particular prop;
  + wait for real use-case;
