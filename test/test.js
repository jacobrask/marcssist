describe("marcssist", function(){

  it("should be available on window", function(){
    expect(window.marcssist).to.exist;
    expect(window.marcssist).to.be.a("function");
  });

});


describe("marcssist.style(style)", function(){

  var mx = window.marcssist;
  var testElem;

  beforeEach(function() {
    testElem = document.createElement("div");
    document.body.appendChild(testElem);
  });

  afterEach(function() {
    clearSheet(mx._sheet);
    testElem.remove();
    testElem = null;
  });

  describe("basic", function() {

    it("should exist", function() {
      expect(mx.style).to.exist;
      expect(mx.style).to.be.a("function");
    });

    it("should return a string", function() {
      var className = mx.style();
      expect(className).to.be.a.string;
      expect(className).to.equal("");
      className = mx.style({ width: "1px" });
      expect(className).to.have.string("mx");
    });

    it("should add a class that styles an element", function() {
      var className = mx.style({ width: "1px" });
      testElem.classList.add(className);
      expect(getComputedStyle(testElem).width).to.equal("1px");
    });

    it("should add a CSS rule", function() {
      mx.style({ width: "1px", height: "2px" });
      expect(mx._sheet.cssRules).to.have.length(1);
      var ruleStyle = mx._sheet.cssRules[0].style;
      expect(ruleStyle).to.have.length(2);
      expect(ruleStyle["width"]).to.equal("1px");
      expect(ruleStyle["height"]).to.equal("2px");
    });

    it("should accept an array of style objects", function() {
      mx.style([{width: "1px"}, {height: "2px"}, {width:"3px"}]);
      expect(mx._sheet.cssRules).to.have.length(1);
      var ruleStyle = mx._sheet.cssRules[0].style;
      expect(ruleStyle).to.have.length(2);
      expect(ruleStyle["width"]).to.equal("3px");
      expect(ruleStyle["height"]).to.equal("2px");
    });

    it("accepts camelCased properties", function() {
      mx.style({ borderRadius: "1px" });
      expect(mx._sheet.cssRules).to.have.length(1);
      expect(mx._sheet.cssRules[0].style.borderRadius).to.equal("1px");
    });

  });


  describe("nesting and selectors", function() {

    it("should add a CSS rule for each object", function() {
      mx.style({ width: "1px", ".foo": { height: "2px", color: "red" }});
      expect(mx._sheet.cssRules).to.have.length(2);
      expect(mx._sheet.cssRules[0].style.width).to.equal("1px");
      expect(mx._sheet.cssRules[1].selectorText).to.have.string(" .foo");
      expect(mx._sheet.cssRules[1].style.height).to.equal("2px");
    });

  });


  describe("vendor prefixing", function() {

    it("should add vendor prefixes to some properties", function() {
      mx.style({ columnCount: 1 });
      expect(mx._sheet.cssRules[0].style.columnCount).to.not.exist;
      expect(mx._sheet.cssRules[0].style.webkitColumnCount).to.equal("1");
    });

  });


  describe("add units", function() {

    it("should add units to some properties", function() {
      mx.style({ lineHeight: 1, width: 1 });
      expect(mx._sheet.cssRules[0].style.lineHeight).to.equal("1");
      expect(mx._sheet.cssRules[0].style.width).to.equal("1px");
    });

  });


});



describe("marcssist(options)", function(){

  it("should have an option to disable vendor prefixes", function() {
    var mx = marcssist({ prefix: false });
    mx.style({ columnCount: 1, flexGrow: 1 });
    expect(mx._prefix).to.equal(null);
    expect(mx._sheet.cssRules[0].style.webkitColumnCount).to.not.equal("1");
    expect(mx._sheet.cssRules[0].style.flexGrow).to.equal("1");
  });


  it("should have an option to disable auto units", function() {
    var mx = marcssist({ prefix: false });
    mx.style({ lineHeight: 1, width: 1 });
    expect(mx._sheet.cssRules[0].style.lineHeight).to.equal("1");
    expect(mx._sheet.cssRules[0].style.width).to.equal("1px");
  });


  it("should have an option to change auto units", function() {
    var mx = marcssist({ unit: "em" });
    mx.style({ lineHeight: 1, width: 1 });
    expect(mx._sheet.cssRules[0].style.lineHeight).to.equal("1");
    expect(mx._sheet.cssRules[0].style.width).to.equal("1em");
  });



});

function clearSheet(sheet) {
  if (sheet == null) return;
  Array.prototype.forEach.call(sheet.cssRules, function(rule, idx) {
    sheet.deleteRule(idx);
  });
}
