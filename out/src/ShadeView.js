"use strict";
var CodeSegmentType, CacheType, __awaiter = this && this.__awaiter || function (e, n, s, l) {
    return new (s = s || Promise)(function (r, t) {
        function a(e) {
            try {
                o(l.next(e))
            } catch (e) {
                t(e)
            }
        }

        function i(e) {
            try {
                o(l.throw(e))
            } catch (e) {
                t(e)
            }
        }

        function o(e) {
            var t;
            e.done ? r(e.value) : ((t = e.value) instanceof s ? t : new s(function (e) {
                e(t)
            })).then(a, i)
        }
        o((l = l.apply(e, n || [])).next())
    })
};
Object.defineProperty(exports, "__esModule", {
    value: !0
}), exports.CodeSegments = exports.CodeSegmentType = exports.ShadeView = void 0;
const vscode_1 = require("vscode"),
    Utilities_1 = require("./Utilities"),
    functionsConfig = require("./data/functions.json"),
    ValuesConfig = require("./data/values.json"),
    keywordsConfig = require("./data/keywords.json"),
    IntellisenseConfig = require("./data/intellisense.json"),
    Builtin_1 = require("./Builtin"),
    functions = functionsConfig,
    values = ValuesConfig,
    keywords = keywordsConfig,
    intellisense = IntellisenseConfig,
    BuiltInShaderLibrary = ["Packages/com.unity.render-pipelines.core/ShaderLibrary/SpaceTransforms.hlsl", "UnityPBSLighting.cginc", "ShadeViewUtilities.cginc", "HLSLSupport.cginc", "ShadeViewVariables.cginc", "Lighting.cginc", "out/src/inc/sm5.std"],
    RegionPairs = {
        "//#region": "//#endregion",
        "//region": "//endregion"
    },
    ProgramBlocksPairs = {
        CGPROGRAM: "ENDCG",
        CGINCLUDE: "ENDCG",
        HLSLPROGRAM: "ENDHLSL",
        HLSLINCLUDE: "ENDHLSL",
        GLSLPROGRAM: "ENDGLSL",
        GLSLINCLUDE: "ENDGLSL",
        CBUFFER_START: "CBUFFER_END",
        UNITY_INSTANCING_CBUFFER_START: "UNITY_INSTANCING_CBUFFER_END",
        BEGIN_OPTIONS: "END_OPTIONS",
        BEGIN_PROPERTIES: "END_PROPERTIES",
        BEGIN_CBUFFER: "END_CBUFFER",
        BEGIN_DEFINES: "END_DEFINES",
        BEGIN_CODE: "END_CODE",
        BEGIN_PASS: "END_PASS",
        BEGIN_CUSTOM_PASS: "END_CUSTOM_PASS"
    },
    MarcosPairs = {
        "#if": ["#elif", "#else", "#endif"],
        "#el": ["#elif", "#else", "#endif"]
    };
class ShadeView {
    constructor(e, t) {
        this.document = e, this.position = t
    }
    static IsDisabled(e) {
        let t = Utilities_1.default.getFileName(e.fileName).toLowerCase();
        if (t.endsWith(".std")) return !0;
        let r = vscode_1.workspace.getConfiguration();
        var a = r.get("shaderCompile.disable"),
            e = e.uri.fsPath.toLowerCase(),
            e = Utilities_1.default.isInTempFolder(e);
        return !(!(t.startsWith("compiled-") || t.startsWith("generatedfrom")) || !e) && a
    }
    provideFoldingRanges() {
        var r, a = this.document.getText(),
            e = this.document.lineCount;
        let i = [];
        for (let t = 0; t < e; t++) {
            const o = this.document.lineAt(t);
            let e = this.matchPairs(o, RegionPairs);
            e ? i.push(e) : Utilities_1.default.IsCommentLine(o.text) || (e = this.matchPairs(o, ProgramBlocksPairs), e ? i.push(e) : (e = this.matchMacros(o), e ? i.push(e) : -1 == (r = o.text.indexOf("{")) || (r = this.document.offsetAt(o.range.start) + r, (r = this.findBracketEndMatch(a, r)) && i.push({
                start: t,
                end: this.document.positionAt(r).line - 1,
                kind: vscode_1.FoldingRangeKind.Imports
            }))))
        }
        return i
    }
    findBracketEndMatch(e, t) {
        let r = t + 1,
            a = 1;
        for (; r < e.length;) {
            var i = this.document.positionAt(r),
                i = this.document.lineAt(i).text;
            if ("{" !== e.charAt(r) || Utilities_1.default.IsCommentLine(i) || a++, "}" !== e.charAt(r) || Utilities_1.default.IsCommentLine(i) || a--, 0 === a) break;
            r++
        }
        if (0 == a) return r
    }
    matchMacros(e) {
        for (var t in MarcosPairs)
            if (e.text.trim().startsWith(t)) {
                t = this.findMacroEndPairMatch(e.lineNumber + 1, MarcosPairs[t]) - 1;
                if (0 < t) return {
                    start: e.lineNumber,
                    end: t,
                    kind: vscode_1.FoldingRangeKind.Region
                }
            }
    }
    findMacroEndPairMatch(e, r) {
        let a = 1;
        for (let t = e; t < this.document.lineCount; t++) {
            var i = this.document.lineAt(t);
            let e = this.removeAllSpaces(i.text);
            if (e.startsWith("#if")) a++;
            else {
                for (const o of r)
                    if (e.startsWith(o)) {
                        if (1 < a) {
                            e.startsWith("#end") && a--;
                            break
                        }
                        return t
                    } if (0 == a) return t
            }
        }
        return -1
    }
    removeAllSpaces(e) {
        return e.replace(/\s/g, "")
    }
    matchPairs(e, t) {
        let r = new Map;
        for (var a in t) {
            var i = t[a];
            r.has(i) ? r.get(i).push(a) : r.set(i, [a])
        }
        for (var o in t)
            if (e.text.trim().startsWith(o)) {
                o = t[o], o = this.findEndPairMatch(e.lineNumber + 1, o, r.get(o)) - 1;
                if (0 < o) return {
                    start: e.lineNumber,
                    end: o,
                    kind: vscode_1.FoldingRangeKind.Region
                }
            }
    }
    findEndPairMatch(e, a, i) {
        let o = 1;
        for (let r = e; r < this.document.lineCount; r++) {
            let e = this.document.lineAt(r),
                t = e.text.trim();
            for (const n of i)
                if (t.startsWith(n)) {
                    o++;
                    break
                } if (t.startsWith(a) && o--, 0 == o) return r
        }
        return -1
    }
    provideCompletions() {
        return __awaiter(this, void 0, void 0, function* () {
            let e = this.document.lineAt(this.position).text;
            var t, r, a = e.charAt(this.position.character - 1);
            let i = [];
            return "/" == a || "\\" == a ? this.isInIncludeLine() && (i = this.getIncludeCompletion()) : this.isInTagsClourse(this.document, this.position) ? i = this.getTagsCompletions(this.document, this.position) : (t = Utilities_1.default.getFirstNonSpaceCharInvInText(e, this.position.character - 1), r = () => {
                e.trim().startsWith("#") || -1 != e.indexOf("?") || (i = this.getRegisterTypeSet())
            }, ":" === a ? 0 < this.position.character - 2 && ":" == e.charAt(this.position.character - 2) ? i = this.getStaticMemebers(this.document, this.position) : r() : ":" === t ? r() : this.isInPropertyDrawer(this.document, this.position) ? (i = this.getPropertyDrawersCompletionItem(), BetterShadersServices.isBetterShaders(this.document.uri.fsPath) && (i = i.concat(BetterShadersServices.getPropertyDrawers()))) : "." === a ? i = this.getVariablesIntellisenseSet(this.document, this.position) : " " === a ? i = this.getIntellisenseSet(this.document, this.position) : a && (i = yield this.getNormalCaseSet(this.document))), i
        })
    }
    isInPropertyDrawer(r, a) {
        if (!r) return !1;
        let e = r.uri.fsPath;
        if (e.endsWith(".shader") || BetterShadersServices.isBetterShaders(e)) {
            let e = r.lineAt(a.line).text;
            a = a.character;
            if (!e || !e.trim()) return !1;
            let t = e.trimLeft();
            if (!t.startsWith("[")) return !1;
            a = e.substring(0, a + 1).trimLeft();
            return /\[[\w\d]*]/.test(a)
        }
        return !1
    }
    getStaticMemebers(e, t) {
        t = e.getWordRangeAtPosition(t.translate(0, -2)), t = e.getText(t), e = this.getAllStructsIncludeInDocuments(e);
        let r = this.getTypeInfoInSetByName(t, e),
            a = [];
        return r && r.methods.forEach(e => {
            let t = e.label;
            var r;
            t && t.trimLeft().startsWith("static") && (r = e.documentation.toString(), e = this.getMethodNameFromSignatureCode(t), a.push(this.getCompletionProposal(e, r, r, vscode_1.CompletionItemKind.Method)))
        }), a
    }
    isInIncludeLine() {
        let e = this.document.lineAt(this.position).text;
        return !e.trim().startsWith("/") && ShadeView.IncludeDefinationRegPattern.test(e)
    }
    getIncludeCompletion() {
        var e = this.document.lineAt(this.position).text,
            e = this.getIncludeFiles(e)[0];
        let t = Utilities_1.default.translatePackagePath(this.document.uri, e),
            r = [];
        t.forEach(t => {
            t.startsWith("local:") ? r.push(t) : Utilities_1.default.getFiles(t).filter(e => !e.startsWith(".") && !e.endsWith(".meta")).forEach(e => {
                r.push(Utilities_1.default.join(t, e))
            })
        });
        let a = [];
        return r.forEach(t => {
            if (t.startsWith("local:")) {
                var r = t.substring(6);
                a.push(this.getCompletionProposal(r, r, "", vscode_1.CompletionItemKind.Folder))
            } else {
                r = Utilities_1.default.isFolder(t);
                let e = Utilities_1.default.getFileName(t);
                r && (e = e.replace(/@[0-9a-zA-Z_\.-]+/, "")), a.push(this.getCompletionProposal(e, t, "", r ? vscode_1.CompletionItemKind.Folder : vscode_1.CompletionItemKind.File))
            }
        }), a
    }
    getTagsCompletions(e, t) {
        let r = [],
            a = this.getTagsCodeStringFromPosition(e, t),
            i = a.replace(/[\{\"]/gi, "="),
            o = Utilities_1.default.removeEmptyEntry(i.split("="));
        return r = o.length % 2 == 1 ? a.endsWith('"') ? this.getTagsValueCompletionSet(o[o.length - 1].trim()) : this.getTagsKeyCompletionSet() : a.endsWith('"') ? this.getTagsKeyCompletionSet() : this.getTagsValueCompletionSet(o[o.length - 1].trim()), r
    }
    getTagsValueCompletionSet(e) {
        let t = [];
        if (!intellisense || !intellisense.Tags) return t;
        var r = intellisense.Tags[e];
        if (r && r.values)
            for (var a in r.values) {
                var i = r.values[a];
                t.push(this.getCompletionProposal(a, "", i, vscode_1.CompletionItemKind.Property))
            }
        return t
    }
    getTagsKeyCompletionSet() {
        let e = [];
        if (!intellisense || !intellisense.Tags) return e;
        for (var t in intellisense.Tags) {
            var r = intellisense.Tags[t];
            r && e.push(this.getCompletionProposal(t, "", r.documentation, vscode_1.CompletionItemKind.Property))
        }
        return e
    }
    getTagsCodeStringFromPosition(e, t) {
        t = new vscode_1.Range(new vscode_1.Position(0, 0), t);
        let r = e.getText(t);
        t = r.toLowerCase().lastIndexOf("tags");
        if (-1 != t) return r.substring(t + 4).trim()
    }
    isInTagsClourse(e, t) {
        let r = this.getTagsCodeStringFromPosition(e, t);
        return !(!r || !r.startsWith("{") || -1 !== r.indexOf("}"))
    }
    getVariablesIntellisenseSet(e, t) {
        let i = new Map;
        var r = this.getAllStructsIncludeInDocuments(e),
            t = this.getVariableTypeName(e, t, this.getAdditonTypeString(r), r);
        let a = this.getTypeInfoInSetByName(t, r);
        a && (a.fields.forEach(e => {
            var t = e.name + "{f}";
            i.has(t) || (e = this.getCompletionProposal(e.name, e.type, e.documentation, vscode_1.CompletionItemKind.Field), i.set(t, e))
        }), a.methods.forEach(e => {
            let t = e.label;
            var r, a;
            t && t.trimLeft().startsWith("static") || (a = e.documentation.toString(), e = (r = this.getMethodNameFromSignatureCode(t)) + "m", i.has(e) || (a = this.getCompletionProposal(r, a, a, vscode_1.CompletionItemKind.Method), i.set(e, a)))
        }));
        let o = [];
        for (const n of i.values()) o[o.length] = n;
        return o
    }
    getAdditonTypeString(e) {
        let t = [];
        return e.forEach(e => {
            e && this.extractLabel(e) && t.push(e.label)
        }), t
    }
    getAllStructsIncludeInDocuments(e) {
        return ShadeViewCaching.getAllStrutcs(e, this.getAllStructsIncludeInDocumentsUpdate.bind(this))
    }
    getAllStructsIncludeInDocumentsUpdate(e) {
        var t = e.getText();
        let r = this.getIncludeFiles2(t, e.uri, !0, this.document.offsetAt(this.position)),
            a = this.getStructAndItsChildren(t);
        return a = a.concat(this.getStructAndItsChildren(Builtin_1.default.StructInfo)), r.forEach(e => {
            a = a.concat(this.getStructAndItsChildren(e.getContent()))
        }), BetterShadersServices.isBetterShaders(e.uri.fsPath) && (t = BetterShadersServices.getBlackboardFieldsCode(t), t = BetterShadersServices.getSharedStructsCode(t), a = a.concat(this.getStructAndItsChildren(t))), a
    }
    getFieldTypeInStruct(t, r) {
        if (t && t.fields && r)
            for (let e = 0; e < t.fields.length; e++) {
                var a = t.fields[e];
                if (a.name === r) return a.type
            }
    }
    getTypeInfoInSetByName(e, t) {
        for (var r in t) {
            r = t[r];
            if (r && this.isTypeLike(e, r.label)) return r
        }
    }
    getVariablesHierarchy(r, e) {
        let a = [],
            i = r.length - 1;
        for (let t = r.length - 1 + e; 0 <= t; t--) {
            var o = r.charAt(t);
            if (")" === o) {
                a.push(new VariableHierarchyItem(Utilities_1.default.getMethodNameIfInMethodRange(r, t - 1), !0));
                break
            }
            let e = [" ", ",", "{", "(", "[", "\t", ";", "+", "-", "*", "/", ":", "\n", "\r", "="];
            if (-1 !== e.indexOf(o)) {
                var n = r.substring(t + 1, i);
                a.push(new VariableHierarchyItem(n, !1));
                break
            }
            "." === o && (o = r.substring(t + 1, i), a.push(new VariableHierarchyItem(o, !1)), i = t)
        }
        return a
    }
    getVariableTypeName(e, t, r, a) {
        var i = new vscode_1.Range(new vscode_1.Position(0, 0), t),
            o = e.getText(i),
            i = e.lineCount,
            i = e.lineAt(i - 1),
            i = new vscode_1.Range(t, i.range.end),
            i = e.getText(i);
        let n = "";
        var s = this.getVariablesHierarchy(o, -1).reverse();
        if (0 === s.length) return "";
        let l;
        if (s[0].isMethod) {
            let t = s[0].Name;
            if (t) {
                var d = this.getAllMethodInfo(e);
                for (let e = 0; e < d.length; e++) {
                    var m = d[e];
                    if (m && this.extractKey(m).trim() === t.trim()) {
                        l = this.getMethodReturnType(m);
                        break
                    }
                }
            }
        } else {
            var h = s[0].Name;
            let t = this.getVariablesInfo(o, r.join("|"));
            for (let e = t.length - 1; 0 <= e; e--) {
                var u = t[e];
                if (u && u.label === h) {
                    l = u.detail;
                    break
                }
            }
            if (!l) {
                t = this.getVariablesInfo(i, r.join("|"));
                for (let e = 0; e < t.length; e++) {
                    var c = t[e];
                    if (c && c.label === h) {
                        l = c.detail;
                        break
                    }
                }
            } !l && values.Items[h] && (l = values.Items[h].type)
        }
        if (l) {
            n = l;
            for (let e = 1; e < s.length; e++) {
                var f = this.getTypeInfoInSetByName(n, a);
                n = this.getFieldTypeInStruct(f, s[e].Name)
            }
        }
        return n
    }
    getIntellisenseSet(e, t) {
        let a = [],
            r = Utilities_1.default.getFirstNonSpaceTexInv(e, t),
            i = Utilities_1.default.getSecondNonSpaceTexInv(e, t);
        if (!r) return a;
        t = e => {
            for (var t in e) {
                var r = e[t];
                a.push(this.getCompletionProposal(t, "", r, intellisense.ItemKind))
            }
        };
        let o = intellisense.Items[r.toLowerCase()];
        return o && o.values ? t(o.values) : (o = intellisense.Items[i.toLowerCase()], o && o.values && o.operation && 2 === o.operation && t(o.values)), a
    }
    getRegisterTypeSet() {
        let e = [];
        for (var t in keywords.Items.reg) {
            t = keywords.Items.reg[t];
            e.push(this.getCompletionProposal(t, "", "", keywords.ItemKind))
        }
        return e
    }
    getAllMethodInfo(e) {
        return ShadeViewCaching.getAllMethodsInfo(e, this.getAllMethodInfoUpdate.bind(this))
    }
    getAllMethodInfoUpdate(e) {
        let t = [];
        for (var r in functions.Items) {
            var a = functions.Items[r];
            t.push(this.getCompletionProposal(r, a.detail, a.Synopsis, functions.ItemKind))
        }
        var i = e.getText();
        t = t.concat(this.getMethodInfo(i));
        let o = this.getIncludeFiles2(i, e.uri, !0, this.document.offsetAt(this.position));
        return o.forEach(e => {
            t = t.concat(this.getMethodInfo(e.getContent()))
        }), t
    }
    getCompletionInDataConfig() {
        return ShadeViewCaching.getCompletions(CacheType.DataConfig, "Data", () => {
            let t = [];
            for (var e in functions.Items) {
                var r = functions.Items[e];
                t.push(this.getCompletionProposal(e, r.detail, r.documentation, functions.ItemKind))
            }
            for (var a in values.Items) {
                var i = values.Items[a];
                t.push(this.getCompletionProposal(a, i.detail, i.documentation, values.ItemKind))
            }
            for (var o in keywords.Items) {
                var n, s, l = keywords.Items[o];
                for (n in l) {
                    let e = l[n];
                    e && (s = this.getDocumentationInIntellisenseConfig(e.toLowerCase(), intellisense), t.push(this.getCompletionProposal(e, "", s, keywords.ItemKind)))
                }
            }
            return t
        })
    }
    getMethodCCFromCache(e) {
        return ShadeViewCaching.getCompletions(CacheType.Method, e.path, () => this.getMethodInfo(e.getContent()))
    }
    getMacroCCFromCache(e) {
        return ShadeViewCaching.getCompletions(CacheType.Macro, e.path, () => this.getMacrosDefinations(e.getContent()))
    }
    getTypesCCFromCache(e) {
        return ShadeViewCaching.getCompletions(CacheType.Types, e.path, () => this.getTypesInfo(e.getContent()))
    }
    getDocumentVariableCCFromCache(n, s) {
        return __awaiter(this, void 0, void 0, function* () {
            return ShadeViewCaching.getCompletionsAsync(CacheType.DocumentVariables, n.path, () => __awaiter(this, void 0, void 0, function* () {
                let e = [];
                var t = yield ShadeViewCaching.getTextDocument(n.path);
                let r = [...s],
                    a = this.getTypeCodeSymbols(t, r.join("|"));
                a.forEach(e => r.push(e.name));
                var i = r.join("|");
                a = a.concat(this.getMethodCodeSymols(t, i, !0));
                for (const o of this.getDocumentVariableCodeSymbols(t, i, !0, a)) e.push({
                    label: o.name,
                    insertText: o.name,
                    kind: vscode_1.CompletionItemKind.Variable
                });
                return e
            }))
        })
    }
    mergeResultsToMap(e, t) {
        if (t)
            for (const a of t) {
                var r;
                a && a.label && (r = this.extractKey(a), e.has(r) || e.set(r, a))
            }
    }
    getNormalCaseSet(p) {
        return __awaiter(this, void 0, void 0, function* () {
            let e = new Map,
                t = this.getCompletionInDataConfig();
            this.mergeResultsToMap(e, t);
            var r = BetterShadersServices.isBetterShaders(p.uri.fsPath),
                a = p.getText();
            t = this.getMethodInfo(a), this.mergeResultsToMap(e, t);
            var i, o, n = this.getIncludeFiles2(a, p.uri, !0, this.document.offsetAt(this.position));
            for (const h of n) t = this.getMethodCCFromCache(h), this.mergeResultsToMap(e, t);
            r && (t = ShadeViewCaching.getBetterShadersCommonFunctions(this), this.mergeResultsToMap(e, t)), t = this.getMacrosDefinations(a), this.mergeResultsToMap(e, t);
            for (const u of n) t = this.getMacroCCFromCache(u), this.mergeResultsToMap(e, t);
            r && (t = ShadeViewCaching.getBetterShadersMacros(this), this.mergeResultsToMap(e, t)), t = this.getPropertiesInfo(a), this.mergeResultsToMap(e, t);
            let s = this.getTypesInfo(a);
            this.mergeResultsToMap(e, s);
            for (const c of n) {
                var l = this.getTypesCCFromCache(c);
                s = s.concat(l), this.mergeResultsToMap(e, l)
            }
            let d = this.getAdditonTypeString(s);
            for (i of s)
                if (i) {
                    let e = this.extractLabel(i);
                    e && (d.push(e), -1 !== (o = e.indexOf("<")) && (i.label = e.substring(0, o), i.insertText = i.label))
                } t = this.getVariablesInfo(a, d.join("|")), this.mergeResultsToMap(e, t);
            for (const f of n) t = yield this.getDocumentVariableCCFromCache(f, d), this.mergeResultsToMap(e, t);
            r && (t = BetterShadersServices.getKeywords(), this.mergeResultsToMap(e, t));
            let m = [];
            for (const g of e.values()) m[m.length] = g;
            return e = null, t = null, m
        })
    }
    extractLabel(e) {
        return e && e.label ? ("string" == typeof e.label ? e : e.label).label : null
    }
    extractKey(e) {
        return e && e.kind ? this.extractLabel(e) + e.kind : null
    }
    getPropertyDrawersCompletionItem() {
        let e = [];
        if (!intellisense || !intellisense.PropertyDrawers) return e;
        for (const r in intellisense.PropertyDrawers) {
            var t = intellisense.PropertyDrawers[r];
            e.push(this.getCompletionProposal(r, r, t, vscode_1.CompletionItemKind.Keyword))
        }
        return e
    }
    getMacrosDefinations(e) {
        return this.getCompletionItemFromMatchResult(e, this.getMacrosDefinitationFromCode, e => {
            var t = e.indexOf("(");
            return -1 !== t ? this.getCompletionProposal(e.substring(8, t), e.substring(8), "", vscode_1.CompletionItemKind.Method) : this.getCompletionProposal(e.substring(8), "", "", vscode_1.CompletionItemKind.Property)
        })
    }
    getVariablesInfo(e, t, r = !1) {
        let a = [];
        var i, o = this.getVariablesFromCode(e, t, r);
        for (i in o) {
            let t = o[i];
            if (t) {
                let e = t.substring(0, t.length - 1).split(" ", 2);
                if (2 == e.length) {
                    var n = e[0].trim();
                    for (const s of this.getVariablesNameInPatternMatch(t)) a.push(this.getCompletionProposal(s, n, "", vscode_1.CompletionItemKind.Variable))
                }
            }
        }
        return a
    }
    getPropertiesInfo(e) {
        return this.getCompletionItemFromMatchResult(e, this.getPropertiesDefinationFromCode, e => {
            let t = e.replace(/\(/gi, ",").replace(/\)/gi, ",").split(",");
            if (4 <= t.length) return this.getCompletionProposal(t[0].trim(), t[2].trim(), "", vscode_1.CompletionItemKind.Property)
        })
    }
    getTypesInfo(e) {
        return this.getCompletionItemFromMatchResult(e, this.getStructDefinitionFromCode, e => {
            let t = e.substring(6, e.length - 7).split("{");
            if (2 <= t.length) return this.getCompletionProposal(t[0].trim(), "struct", "", vscode_1.CompletionItemKind.Struct)
        })
    }
    getStructAndItsChildren(e) {
        let t = [];
        var r, a = this.getStructFullDefinitionFromCode(e);
        for (r in a) {
            var i = this.getTypeInformationFromStructFullCode(a[r]);
            i && t.push(i)
        }
        return t
    }
    static removeComments(e) {
        let t = ShadeView.getCodeSegments(e),
            r = "";
        return t.forEach(e => {
            e.type !== CodeSegmentType.Comment && (r += e.code)
        }), r
    }
    getTypeInformationFromStructFullCode(r) {
        let a = ShadeView.removeComments(r);
        if (a) {
            let e = a.substring("struct".length).split("{", 2);
            if (2 == e.length) {
                let i = new TypeInfomation;
                r = e[0].trim();
                if (i.label = r, !i.label) return;
                var o, n = e[1].trim().split(/[;\r\n]/);
                let t = !1;
                for (o in n) {
                    let e = n[o];
                    if (e = e.replace(/[\s\S]+\)/gi, ""), -1 == e.indexOf("{") && -1 == e.indexOf("(") || (t = !0), t && -1 != e.indexOf("}") && (t = !1), !t) {
                        let a = this.getTypeFiledInfomation(e);
                        if (a)
                            if (-1 !== a.name.indexOf(",")) {
                                let r = a.name.split(",");
                                for (let t = 0; t < r.length; t++) {
                                    let e = new TypeFiledInformation;
                                    e.name = r[t].trim(), e.documentation = a.documentation, e.type = a.type, i.fields.push(e)
                                }
                            } else i.fields.push(a)
                    }
                }
                for (const s of this.getMethodInfoInCode(a)) i.methods.push(this.getSignatureInformationFromCode(s.signature, s.signature));
                return i
            }
        }
    }
    getTypeFiledInfomation(a) {
        let i = a.trim(),
            e = i.indexOf("//");
        if (-1 !== e && (i = i.substring(0, e + 1)), e = i.indexOf(":"), -1 !== e && (i = i.split(":", 2)[0]), -1 !== i.indexOf(",")) {
            i.endsWith(";") && (i = i.substring(0, i.length - 1));
            let e = Utilities_1.default.removeEmptyEntry(i.split(",")),
                t = new TypeFiledInformation,
                r = e[0].split(" ");
            return 2 <= r.length && (t.type = r[r.length - 2].trim()), e[0] = r[r.length - 1].trim(), t.name = e.join(","), t.documentation = a.trim(), t
        } {
            let t = Utilities_1.default.removeEmptyEntry(i.split(" "));
            if (2 <= t.length) {
                let e = new TypeFiledInformation;
                return e.name = t[t.length - 1].trim(), -1 != e.name.indexOf("[") && (e.name = e.name.split("[")[0]), e.type = t[t.length - 2].trim(), e.documentation = a.trim(), e
            }
        }
    }
    getMethodReturnType(e) {
        if (e.kind === vscode_1.CompletionItemKind.Method && "string" == typeof e.documentation) {
            e = Utilities_1.default.removeEmptyEntry(e.documentation.split(" "));
            if (0 < e.length) return e[0]
        }
    }
    getMethodInfo(e) {
        let t = [];
        for (const a of this.getMethodCodeLineFromCode(e)) {
            var r = this.getMethodNameFromSignatureCode(a);
            r && t.push(this.getCompletionProposal(r, "", a.substring(0, a.length - 1).trim(), vscode_1.CompletionItemKind.Method))
        }
        return t
    }
    getCompletionItemFromMatchResult(e, t, r) {
        let a = [];
        var i, o = t(e);
        for (i in o) {
            var n = o[i];
            n && r(n) && a.push(r(n))
        }
        return a
    }
    getCompletionProposal(e, t, r, a) {
        let i = new vscode_1.CompletionItem(e, a);
        return i.detail = t, i.documentation = r, i
    }
    provideHover() {
        return __awaiter(this, void 0, void 0, function* () {
            var r = this.document.getWordRangeAtPosition(this.position);
            let a = this.document.getText(r);
            if (this.isInIncludeLine()) return new vscode_1.Hover(a, r);
            let e;
            if (e = values.Items[a], e) return new vscode_1.Hover(e.documentation, r);
            let i = this.document.lineAt(this.position.line).text;
            if (e = functions.Items[a], e) {
                let t = !1;
                for (let e = r.end.character; e < i.length; e++) {
                    var o = i.charAt(e);
                    if (" " !== o) {
                        if ("(" !== o) break;
                        t = !0;
                        break
                    }
                }
                if (t) return new vscode_1.Hover(e.documentation, r)
            }
            if (!ShadeView.IsDisabled(this.document)) {
                var n = this.getDocumentationInIntellisenseConfig(a.toLowerCase(), intellisense);
                if (n) return new vscode_1.Hover(n, r);
                var s = this.document.getText();
                if (a != s && /[\w_\d]+/.test(a)) {
                    n = this.getAllStructsIncludeInDocuments(this.document);
                    let e = this.document.offsetAt(r.end);
                    e = e >= s.length - 2 ? s.length - 1 : e + 1;
                    n = this.getVariableTypeName(this.document, this.document.positionAt(e), this.getAdditonTypeString(n), n);
                    let t = yield this.tryGetDefinitionCommentLines(this.position);
                    return n ? new vscode_1.Hover([new vscode_1.MarkdownString(0 < t.length ? t.join("") : ""), {
                        language: "shadeview",
                        value: n + " " + a
                    }], r) : new vscode_1.Hover(0 < t.length ? t.join("") : a, r)
                }
                return null
            }
        })
    }
    tryGetDefinitionCommentLines(n) {
        return __awaiter(this, void 0, void 0, function* () {
            var r = yield this.GoToDefinition(n);
            let a = [];
            if (r) {
                let e = yield ShadeViewCaching.getTextDocument(r.uri.fsPath), t = e.lineAt(r.range.start);
                if (t) {
                    var i = Math.max(t.lineNumber - 128, 0),
                        r = new vscode_1.Range(e.lineAt(i).range.start, t.range.start),
                        i = e.getText(r);
                    if (ShadeView.MethodDeclarationPattern.test(t.text)) {
                        r = this.document.getWordRangeAtPosition(n), r = this.document.getText(r), r = t.text.indexOf(" " + r);
                        if (t.text.indexOf("(") < r) return a
                    }
                    var o = ShadeView.getCodeSegments(i);
                    for (let t = o.length - 1; 0 < t; t--) {
                        let e = o[t];
                        if (e.type != CodeSegmentType.Comment && e.code.trim()) break;
                        if (e.code.trim()) {
                            if (!e.code.startsWith("///")) break;
                            a.push(e.code.substring(3).trimRight())
                        } else if (-1 != e.code.indexOf("\n") || -1 != e.code.indexOf("\r")) break
                    }
                    a = a.reverse()
                }
            }
            return a
        })
    }
    provideSignatureHelp() {
        return __awaiter(this, void 0, void 0, function* () {
            var i, o = this.getFunctionName(this.document, this.position);
            if (o) {
                let a = new vscode_1.SignatureHelp,
                    t = !1,
                    r = this.getSignatureDataByFuncNameInConfig(o);
                if (r) r.Synopsis.forEach(e => {
                    a.signatures.push(this.getSignatureInformationFromCode(e, r.documentation))
                });
                else {
                    let e = this.document.getText(),
                        r = this.getSignatureInCodeByName(e, o, this.document.uri.fsPath);
                    if (0 != r.length) a.signatures = r;
                    else {
                        let t = void 0;
                        1 < this.getVariablesHierarchy(e.substring(0, this.document.offsetAt(this.position)), -1).length && (l = this.getAllStructsIncludeInDocuments(this.document), i = this.document.offsetAt(this.position) - o.length - 1, t = this.getVariableTypeName(this.document, this.document.positionAt(i), this.getAdditonTypeString(l), l));
                        var n, s = this.getIncludeFiles2(e, this.document.uri, !0, this.document.offsetAt(this.position));
                        for (n in s) {
                            let e = s[n];
                            if (e && (r = this.getSignatureInCodeByName(e.getContent(), o, e.path, !0, t), 0 < r.length)) {
                                a.signatures = r;
                                break
                            }
                        }
                    }
                    t = 0 < r.length
                }
                if (a.activeParameter = this.calcActiveParameter(this.document, this.position), a.activeSignature = this.calcActiveSignature(a), t) {
                    var l = this.position.translate(0, -2);
                    let e = yield this.tryGetDefinitionCommentLines(l);
                    if (0 < e.length)
                        for (const d of a.signatures) d.documentation = new vscode_1.MarkdownString(e.join(""))
                }
                return a
            }
        })
    }
    getSignatureInCodeByName(e, t, r = void 0, a = !1, i = void 0) {
        let o = [];
        if (i) {
            for (const h of this.getStructAndItsChildren(e))
                if (this.isTypeLike(i, h.label))
                    for (const u of h.methods) this.getMethodNameFromSignatureCode(u.label) == t && o.push(u);
            return o
        }
        let n = [];
        for (var s in n = a && r ? this.getMethodInfoInCodeFromCache(ShadeViewCaching.getIncludeFile(r)) : this.getMethodInfoInCode(e), BetterShadersServices.isBetterShaders(r) && (n = n.concat(this.getBetterShaderMethodInfoFromCache())), n) {
            s = n[s];
            s && s.name === t && o.push(this.getSignatureInformationFromCode(s.signature, s.signature))
        }
        var l, d = this.getMacrosDefinitationFromCode(e);
        for (l in d) {
            let e = d[l];
            var m = e.indexOf("("); - 1 !== m && e.substring(8, m) === t && o.push(this.getSignatureInformationFromCode(e.substring(8), e))
        }
        return o
    }
    getBetterShaderMethodInfoFromCache() {
        return ShadeViewCaching.getMethodSignatureInfo("betterShaderMethodInfo", () => BetterShadersServices.getMethodInfoInCode(this))
    }
    getMethodInfoInCodeFromCache(e) {
        return ShadeViewCaching.getMethodSignatureInfo(e.path, () => this.getMethodInfoInCode(e.getContent()))
    }
    getMethodInfoInCode(e) {
        let t = [];
        var r;
        for (r of this.getMethodCodeLineFromCode(e)) {
            var a = this.getMethodNameFromSignatureCode(r);
            let e = r;
            e.endsWith("{") && (e = e.substring(0, e.length - 2).trim()), t.push({
                name: a,
                signature: e
            })
        }
        return t
    }
    getSignatureInformationFromCode(r, a) {
        return ShadeViewCaching.getSignatureInfo(r, () => {
            let e = new vscode_1.SignatureInformation(r);
            e.documentation = a;
            var t = this.getParameterInfosFromSignatureCode(r);
            return e.parameters = t, e
        })
    }
    getSignatureDataByFuncNameInConfig(e) {
        return functions.Items[e]
    }
    getFunctionName(e, t) {
        let r = 1,
            a;
        var i = e.offsetAt(t);
        let o = e.getText(new vscode_1.Range(new vscode_1.Position(0, 0), t));
        for (a = i - 1; 0 < a && 0 < r; a--) {
            var n = o.charAt(a);
            ")" === n && r++, "(" === n && r--
        }
        if (0 < r || a <= 0) return "";
        i = e.positionAt(a);
        return e.getText(e.getWordRangeAtPosition(i))
    }
    calcActiveSignature(e) {
        let t = 0;
        for (const r of e.signatures) {
            if (r.parameters.length >= e.activeParameter + 1) return t;
            t++
        }
    }
    calcActiveParameter(t, r) {
        let a = 0,
            i = 0,
            o = t.getText();
        for (let e = t.offsetAt(r) - 1; 0 < e; e--) {
            var n = o.charAt(e);
            if ("," === n && 0 === i && a++, "(" === n && i--, ")" === n && i++, i < 0) break
        }
        return a
    }
    GoToDefinition(h) {
        return __awaiter(this, void 0, void 0, function* () {
            let t = this.document.lineAt(h).text;
            if (BetterShadersServices.isBetterShaders(this.document.uri.fsPath)) {
                let e = /BEGIN_SUBSHADERS[\s\S]+?END_SUBSHADERS/gm;
                var i = e.exec(this.document.getText());
                if (i) {
                    var r = this.document.offsetAt(h);
                    if (i.index + 16 < r && r < i.index + i[0].length) {
                        var o = t.replace(/"/gm, "").trim(),
                            n = Utilities_1.default.getPath(this.document.uri, o);
                        return n ? {
                            uri: n,
                            range: new vscode_1.Range(0, 0, 0, 0)
                        } : null
                    }
                }
            }
            if (this.isInIncludeLine()) {
                for (const e of this.getIncludeFiles2(t, this.document.uri, !1))
                    if (null != e.getContent()) return {
                        uri: vscode_1.Uri.file(e.path),
                        range: new vscode_1.Range(0, 0, 0, 0)
                    }
            } else {
                if (ShadeView.IsDisabled(this.document)) return;
                i = this.document.getWordRangeAtPosition(h);
                let e = this.document.getText(),
                    t = this.document.offsetAt(i.end);
                t = t >= e.length - 2 ? e.length - 1 : t + 1;
                o = this.getVariablesHierarchy(e.substring(0, t), -1);
                let r = o[0].Name;
                var n = r.indexOf("<"); - 1 !== n && (r = r.substring(n + 1));
                let a = "";
                1 < o.length && (n = this.getAllStructsIncludeInDocuments(this.document), a = this.getVariableTypeName(this.document, i.start, this.getAdditonTypeString(n), n));
                var s = 1 < o.length,
                    o = this.getCodeSymbols(this.document, !1),
                    o = this.getPossibleCodeSymbol(o, r, a, s);
                if (0 != o.length) return this.getDefintionInPossibleCodeSymbols(o, t);
                var l = this.document.offsetAt(h);
                for (const m of this.getIncludeFiles2(e, this.document.uri, !0, l)) {
                    var d = yield ShadeViewCaching.getTextDocument(m.path), d = this.getCodeSymbols(d, !0), d = this.getPossibleCodeSymbol(d, r, a, s, !0);
                    if (0 < d.length) {
                        d = this.getDefintionInPossibleCodeSymbols(d, l, !0);
                        if (d) return d
                    }
                }
            }
        })
    }
    getDefintionInPossibleCodeSymbols(e, i, t = !1) {
        if (0 != e.length) {
            if (t || 1 == e.length) return e[0].location;
            let r = Number.MAX_VALUE,
                a = void 0;
            return e.forEach(e => {
                var t = Math.abs(e.start - i);
                t < r && (r = t, a = e.location)
            }), a
        }
    }
    getPossibleCodeSymbol(e, t, r, a, i = !1) {
        let o = [];
        return e.forEach(e => {
            a ? this.isTypeLike(r, e.name) && e.children.forEach(e => {
                e.name == t && o.push(this.cloneCodeSymbol(e))
            }) : (i || e.children.forEach(e => {
                e.name == t && o.push(this.cloneCodeSymbol(e))
            }), e.name == t && o.push(this.cloneCodeSymbol(e)))
        }), o
    }
    cloneCodeSymbol(e) {
        let t = new CodeSymbol(e.name, e.type, e.location);
        return t.children = t.children, t.start = e.start, t
    }
    provideSymbols() {
        var t = this.getCodeSymbols(this.document, !0);
        let r = [];
        for (let e = 0; e < t.length; e++) {
            const a = t[e];
            r.push(new vscode_1.SymbolInformation(a.name, a.type, "", a.location)), a.children && 0 < a.children.length && a.children.forEach(e => {
                r.push(new vscode_1.SymbolInformation(e.name, e.type, a.name, e.location))
            })
        }
        return r
    }
    static getCodeSymbolMatchResults(e, t, r, a, i = !0) {
        let o = new RegExp(e.source, r),
            n = [];
        for (var s, l = t.getText(); null != (s = o.exec(l));) {
            var d = t.positionAt(s.index).line;
            if (i) {
                var m = t.lineAt(d).text;
                if (Utilities_1.default.IsCommentLine(m)) continue
            }
            m = t.lineAt(d).range, d = s[0];
            let e = new CodeSymbol(d, a, new vscode_1.Location(t.uri, m));
            e.start = s.index, n.push(e)
        }
        return n
    }
    getPropertyCodeSymbols(e) {
        let t = ShadeView.getCodeSymbolMatchResults(ShadeView.PropertiesDefinationRegPattern, e, "g", vscode_1.SymbolKind.Property);
        return t.forEach(e => e.name = e.name.trim().split(/[ \t\(]/)[0]), t
    }
    getTypeCodeSymbols(f, g) {
        let e = ShadeView.getCodeSymbolMatchResults(ShadeView.StructDefinationRegPattern, f, "gm", vscode_1.SymbolKind.Class),
            p = f.getText();
        return e.forEach(t => {
            let e = t.name;
            t.name = t.name.trim().split(/[ \t\r\n\{}]/)[1];
            var r = e.toString().split("{");
            let a = t.start + r[0].length + 1,
                i = 1;
            for (; a < p.length;) {
                if ("{" == p[a] && i++, "}" == p[a] && i--, 0 == i) {
                    e = p.substring(t.start, a);
                    break
                }
                a++
            }
            let o = new RegExp(this.getVariablesRegPattern(g, !1).source, "gm"),
                n = null;
            for (; null != (n = o.exec(e));) {
                var s = n.index + t.start,
                    l = f.positionAt(s).line,
                    d = f.lineAt(l).range;
                for (const c of this.getVariablesNameInPatternMatch(n[0])) {
                    let e = new CodeSymbol(c, vscode_1.SymbolKind.Field, new vscode_1.Location(f.uri, d));
                    e.start = s, t.children.push(e)
                }
            }
            for (o = new RegExp(ShadeView.MethodDeclarationPattern.source, "gm"); null != (n = o.exec(e));) {
                var m = n.index + t.start,
                    h = f.positionAt(m).line,
                    u = f.lineAt(h).range,
                    h = this.getMethodNameFromSignatureCode(n[0].toString());
                let e = new CodeSymbol(h, vscode_1.SymbolKind.Method, new vscode_1.Location(f.uri, u));
                e.start = m, t.children.push(e)
            }
        }), e
    }
    getMacrosCodeSymbols(e) {
        let t = ShadeView.getCodeSymbolMatchResults(ShadeView.MacrosRegPattern, e, "g", vscode_1.SymbolKind.Property);
        return t.forEach(e => {
            var t = e.name.indexOf("("); - 1 !== t ? (e.name = e.name.substring(8, t), e.type = vscode_1.SymbolKind.Method) : e.name = e.name.substring(8)
        }), t
    }
    getMethodCodeSymols(t, r, a) {
        let i = ShadeView.getCodeSymbolMatchResults(ShadeView.MethodRegPattern, t, "gm", vscode_1.SymbolKind.Method, !1);
        var o = t.getText();
        for (let e = 0; e < i.length; e++) i[e] = this.getRealMethodSymbol(i[e], o);
        let n = [];
        for (let e = 0; e < i.length; e++) {
            var s = i[e],
                s = this.getMethodCodeSymbolFromMatch(s, o, t, r, a);
            s.name && n.push(s)
        }
        return n
    }
    getRealMethodSymbol(t, r) {
        if (1 == t.name.match(/\(/g).length) return t;
        var a = t.start + t.name.length;
        let i = -1,
            o = !1;
        for (let e = a; 0 <= e; e--) {
            var n = r[e];
            if (o) {
                if ("\n" != n) continue;
                t.start = e + 1, t.name = r.substring(t.start, a);
                break
            }
            if (")" == n) {
                if (-1 == i) {
                    i = 1;
                    continue
                }
                i++
            }
            "(" == n && i--, 0 == i && (o = !0)
        }
        return t
    }
    getMethodCodeSymbolFromMatch(e, t, r, a, i) {
        var o = this.getMethodNameFromSignatureCode(e.name),
            n = this.getMethodScopeCode(e, t);
        let s = new CodeSymbol(o, vscode_1.SymbolKind.Method, e.location);
        s.start = e.start;
        let l = new RegExp(this.getVariablesRegPattern(a, i).source, "gm");
        for (var d; d = l.exec(n);) {
            var m = d.index + s.start,
                h = r.positionAt(m).line,
                u = r.lineAt(h).text;
            if (!Utilities_1.default.IsCommentLine(u)) {
                var c = r.lineAt(h).range;
                for (const f of this.getVariablesNameInPatternMatch(d[0])) {
                    let e = new CodeSymbol(f, vscode_1.SymbolKind.Field, new vscode_1.Location(r.uri, c));
                    e.start = m, s.children.push(e)
                }
            }
        }
        return s
    }
    getDocumentVariableCodeSymbols(e, t, r, s) {
        let a = ShadeView.getCodeSymbolMatchResults(this.getVariablesRegPattern(t, r), e, "gm", vscode_1.SymbolKind.Variable),
            l = [];
        return a.forEach(r => {
            var e = this.getVariablesNameInPatternMatch(r.name),
                a = r.location;
            for (const i of e)
                if (i) {
                    r.name = i;
                    let t = !0;
                    for (const o of s)
                        if (0 != o.children.length) {
                            let e = !1;
                            for (const n of o.children)
                                if (n.name == r.name && this.rangeEqual(n.location.range, r.location.range)) {
                                    e = !0;
                                    break
                                } if (e) {
                                    t = !1;
                                    break
                                }
                        } t && l.push({
                            children: [],
                            location: a,
                            name: i,
                            start: r.start,
                            type: r.type
                        })
                }
        }), l
    }
    rangeEqual(e, t) {
        return e.start.line === t.start.line && e.start.character === t.start.character && e.end.line === t.end.line && e.end.character === t.end.character
    }
    getMethodScopeCode(t, r) {
        let a = 1;
        for (let e = t.start + t.name.length; e < r.length; e++) {
            var i = r[e];
            if ("{" != i) {
                if ("}" == i && a--, 0 == a) return r.substring(t.start, e)
            } else a++
        }
        return t.name
    }
    getVariablesNameInPatternMatch(e) {
        var t = Utilities_1.default.removeEmptyEntry(e.split(/[ \t\r\n\);,:\[=]/g));
        let r = [];
        if (-1 != e.indexOf(","))
            for (let e = 1; e < t.length; e++) {
                var a = t[e];
                r.push(a)
            } else 1 < t.length ? r.push(t[1]) : r.push(t[0]);
        return r
    }
    getCodeSymbols(e, t) {
        return ShadeViewCaching.getCodeSymbols(e, t, this.getCodeSymbolsUpdate.bind(this))
    }
    getCodeSymbolsUpdate(e, t) {
        let r = this.getPropertyCodeSymbols(e);
        r = r.concat(this.getMacrosCodeSymbols(e));
        var a = this.getAdditonTypeString(this.getAllStructsIncludeInDocuments(e)).join("|");
        return r = r.concat(this.getMethodCodeSymols(e, a, t)), r = r.concat(this.getTypeCodeSymbols(e, a)), r = r.concat(this.getDocumentVariableCodeSymbols(e, a, !0, r)), r
    }
    static getMatchResult(e, t, r) {
        return t.match(new RegExp(e.source, r))
    }
    getDocumentationInIntellisenseConfig(e, t) {
        if (e) {
            e = t.Items[e];
            if (e) return e.documentation
        }
        return ""
    }
    getParameterInfosFromSignatureCode(r) {
        let a = [];
        var i = r.replace("(", ",").replace(")", "").split(",");
        if (1 < i.length)
            for (let t = 1; t < i.length; t++) {
                var o = i[t];
                let e = new vscode_1.ParameterInformation(r);
                e.label = o, a.push(e)
            }
        return a
    }
    getMethodNameFromSignatureCode(e) {
        let t = e.startsWith("static") ? e.substring(7) : e,
            r = t.replace("(", " ").split(" "),
            a = 0;
        for (let e = 0; e < r.length; e++)
            if (r[e] && a < 1) a++;
            else if (1 === a) return r[e].trim()
    }
    getIncludeFiles2(e, t, r = !0, a = 0) {
        let i = [];
        r && BuiltInShaderLibrary.forEach(e => {
            e = ShadeViewCaching.getPath(t, e);
            e && i.push(e)
        });
        let o = new Map;
        o.set(t.fsPath);
        for (const h of this.getIncludeFiles(e, a)) {
            var n = ShadeViewCaching.getPath(t, h);
            n && i.push(n)
        }
        let s;
        for (; 0 < i.length;) {
            var l = i.shift();
            if (l && !o.has(l) && !o.has(l)) {
                o.set(l), s = ShadeViewCaching.getFileContent(l);
                for (const u of this.getIncludeFiles(s, a)) {
                    var d = ShadeViewCaching.getPath(vscode_1.Uri.file(l), u);
                    d && !o.has(d) && i.push(d)
                }
            }
        }
        s = null, i = null;
        let m = [];
        o.delete(t.fsPath);
        for (const c of o.keys()) m.push(ShadeViewCaching.getIncludeFile(c));
        return o = null, m
    }
    getIncludeFiles(e, i = void 0) {
        let o = e;
        if (0 < i) {
            let t = null,
                r = [],
                a = !1;
            for (; null != (t = ShadeView.PROGRAMPattern.exec(e));) {
                let e = t[0].toString();
                e.startsWith("CGINCLUDE") || e.startsWith("HLSLINCLUDE") ? r.push(e) : !a && i >= t.index && i <= t.index + e.length && (r.push(e), a = !0)
            }
            0 < r.length && (o = r.join("\r\n"))
        }
        let t = [],
            r = {},
            a = this.getIncludeDefinationFromCode(o);
        for (var n in a) {
            let e = a[n];
            e.trim().startsWith("/") || !e || 2 < (n = e.split('"')).length && (r[n[1]] || (t.push(n[1]), r[n[1]] = 1))
        }
        return r = null, a = null, t
    }
    getMethodCodeLineFromCode(e) {
        let o = [],
            t = null,
            r = new RegExp(ShadeView.MethodRegPattern.source, "gm");
        for (; null != (t = r.exec(e));) {
            let i = t[0].toString();
            if (1 != i.match(/\(/g).length) {
                let t = -1,
                    r = !1,
                    a = !1;
                for (let e = i.length - 1; 0 <= e; e--) {
                    var n = i[e];
                    if (a) {
                        if ("\n" != n) continue;
                        o.push(i.substring(e + 1)), r = !0;
                        break
                    }
                    if (")" == n) {
                        if (-1 == t) {
                            t = 1;
                            continue
                        }
                        t++
                    }
                    "(" == n && t--, 0 == t && (a = !0)
                }
                r || o.push(i)
            } else o.push(i)
        }
        return o
    }
    getVariablesFromCode(e, t, r = !1) {
        r = this.getVariablesRegPattern(t, r);
        return ShadeView.getMatchResult(r, e, "g")
    }
    getStructDefinitionFromCode(e) {
        return ShadeView.getMatchResult(ShadeView.StructDefinationRegPattern, e, "gm")
    }
    getStructFullDefinitionFromCode(r) {
        let a = [],
            e = new RegExp(ShadeView.StructDefinationRegPattern, "gm"),
            i = null;
        for (; null != (i = e.exec(r));) {
            let e = 1;
            var o = i[0].toString().split("{");
            let t = i.index + o[0].length + 1;
            for (; t < r.length;) {
                if ("{" == r[t] && e++, "}" == r[t] && e--, 0 == e) {
                    a.push(r.substring(i.index, t));
                    break
                }
                t++
            }
        }
        return a
    }
    getPropertiesDefinationFromCode(e) {
        return ShadeView.getMatchResult(ShadeView.PropertiesDefinationRegPattern, e, "g")
    }
    getIncludeDefinationFromCode(e) {
        return ShadeView.getMatchResult(ShadeView.IncludeDefinationRegPattern, e, "g")
    }
    getMacrosDefinitationFromCode(e) {
        return ShadeView.getMatchResult(ShadeView.MacrosRegPattern, e, "g")
    }
    getVariablesRegPattern(e, t = !1) {
        var r = "((InputPatch|OutputPatch|RWByteAddressBuffer|RWBuffer|ConsumeStructuredBuffer|ByteAddressBuffer|AppendStructuredBuffer|Texture2DMS|Texture2DMSArray|TextureCube|TextureCubeArray|Texture1DArray|RWTexture1DArray|RWTexture2DArray|Texture2DArray|RWTexture2D|Texture2D|StructuredBuffer|RWStructuredBuffer|RWTexture3D|Texture3D|RWTexture1D|Texture1D|Buffer)(<[\\w\\d]+?>)?)|SurfaceOutput|appdata_base|appdata_tan|appdata_full|appdata_img|sampler|sampler2D|sampler3D|samplerCUBE|string|triangle|triangleadj|vector|((float|int|uint|bool|half|fixed|double)(\\d*?|\\d*?x\\d*?))";
        let a;
        return a = e ? t ? `(${r}|${e})\\s+?[\\w\\d_,\\s]+?\\s*?[;=\\[]` : `(${r}|${e})\\s+?([\\w\\d_,\\s]+[;=]|[\\w\\d_,\\s]+?\\s*?[:;\\)=,\\[])` : t ? `(${r})\\s+?[\\w\\d_,\\s]+?\\s*?[;=\\[]` : `(${r})\\s+?([\\w\\d_,\\s]+[;=]|[\\w\\d_,\\s]+?\\s*?[:;\\)=,\\[])`, new RegExp(a)
    }
    static IsProperties(e) {
        return this.PropertiesDefinationRegPattern.test(e)
    }
    static isGenericLike(e, t) {
        if (e === t) return !0;
        let r = e.replace(/ \t/g, ""),
            a = t.replace(/ \t/g, "");
        if (-1 == r.indexOf("<") || -1 == r.indexOf(">") || -1 == a.indexOf("<") || -1 == a.indexOf(">") || this.getCount(r, "<") != this.getCount(a, "<") || this.getCount(r, ">") != this.getCount(a, ">") || this.getCount(r, ",") != this.getCount(a, ",")) return !1;
        for (let e = 0; e < r.length; e++) {
            var i = r[e];
            if (i != a[e]) return !1;
            if ("<" == i) break
        }
        return !0
    }
    static getCount(t, r) {
        let a = 0;
        for (let e = 0; e < t.length; e++) t[e] == r && a++;
        return a
    }
    isTypeLike(e, t) {
        return e == t || ShadeView.isGenericLike(e, t)
    }
    static getCodeSegments(t) {
        let r = !1,
            a = !1,
            i = -1,
            o = 0,
            n = -1,
            s = [];
        for (let e = 0; e < t.length; e++) {
            var l, d, m, h, u = t.charAt(e);
            "/" !== u || -1 !== i || a ? ("\n" === u || e == t.length - 1) && -1 < i && !r ? (l = t.substring(o, i), d = t.substring(i, e == t.length - 1 ? void 0 : e + 1), l && (m = new CodeSegments(l, CodeSegmentType.Code), s.push(m)), m = new CodeSegments(d, CodeSegmentType.Comment), s.push(m), i = -1, o = e + 1) : "*" === u && r ? e + 1 <= t.length && "/" === t.charAt(e + 1) && (d = t.substring(o, i), m = t.substring(i, e + 2), d && (d = new CodeSegments(d, CodeSegmentType.Code), s.push(d)), m = new CodeSegments(m, CodeSegmentType.Comment), s.push(m), i = -1, o = e + 2, r = !1, e++) : '"' !== u || a || -1 != i ? '"' === u && a && -1 == i && (u = t.substring(o, n), h = t.substring(n, e + 1), u && (u = new CodeSegments(u, CodeSegmentType.Code), s.push(u)), h = new CodeSegments(h, CodeSegmentType.String), s.push(h), n = -1, a = !1, o = e + 1) : (a = !0, n = e) : e + 1 <= t.length && ("/" !== (h = t.charAt(e + 1)) ? "*" !== h || (i = e, r = !0, e++) : (i = e, r = !1, e++))
        }
        var e;
        return o < t.length && (e = t.substring(o, t.length), s.push(new CodeSegments(e, CodeSegmentType.Code))), s
    }
}
exports.ShadeView = ShadeView, ShadeView.PropertiesDefinationRegPattern = /[_\d\w]+?\s*?\("[\s\S]*?",[\s\S]*?\)\s*?=/, ShadeView.MethodRegPattern = /(static\s+)?[\d\w_]+?\s+?(?!if|for)[\d\w_]+?\s*?\([\(\)\*/\s\d\w,:_\.=<>\[\]]*?\)\s*?([:/]+?[\s\d\w_=]+?){0,1}\s+?\{/, ShadeView.MethodDeclarationPattern = /(static\s+)?[\d\w_]+?\s+?(?!if|for)[\d\w_]+?\s*?\([\(\)\*/\s\d\w,:_\.=<>\[\]]*?\)\s*?([:/]+?[\s\d\w_=]+?){0,1}/, ShadeView.MacrosRegPattern = /#define[ \t]+([\d\w_]+)(\([\d\w_, ]+\))?/, ShadeView.StructDefinationRegPattern = /\bstruct\b\s*?[\S]*?\s*?\{[\s\S]*?\}[\s]*?;?/, ShadeView.IncludeDefinationRegPattern = /[ \t\/\*]*#include\s*?\"[\s\S]+?\"/, ShadeView.PROGRAMPattern = /[A-Z]+?(PROGRAM|INCLUDE)[\s\S]+?END/gm;
class BetterShadersServices {
    static getMethodInfoInCode(t) {
        let r = t.getMethodInfoInCode(this.CommonFunctions),
            e = t.getMacrosDefinations(this.MACROS);
        return e.filter(e => e.kind == vscode_1.CompletionItemKind.Method).map(e => {
            r.push({
                name: t.extractLabel(e),
                signature: e.detail
            })
        }), r
    }
    static getCommonFunctions(e) {
        return e.getMethodInfo(this.CommonFunctions)
    }
    static getKeywords() {
        return this.KeyWords.map(e => {
            return {
                label: e,
                insertText: e,
                kind: vscode_1.CompletionItemKind.Keyword
            }
        })
    }
    static getPropertyDrawers() {
        return this.PropertyDrawers.map(e => {
            return {
                label: e,
                insertText: e,
                kind: vscode_1.CompletionItemKind.Keyword
            }
        })
    }
    static getMacrosCode() {
        return this.MACROS
    }
    static getSharedStructsCode(e) {
        return this.SharedHLSL_TEMPLATE.replace("%BLACKBOARD%", e)
    }
    static isBetterShaders(e) {
        return !!e && e.endsWith(".surfshader")
    }
    static getBlackboardFieldsCode(e) {
        if (!e) return "";
        e = this.BlackboardBlockPattern.exec(e);
        if (null == e) return "";
        let t = e[0];
        return t.length <= 31 ? "" : t.substring(16, t.length - 16)
    }
}
BetterShadersServices.BlackboardBlockPattern = /BEGIN_BLACKBOARD[\s\S]+?END_BLACKBOARD/gm, BetterShadersServices.SharedHLSL_TEMPLATE = `struct Surface
            {
               half3 Albedo;
               half Height;
               half3 Normal;
               half Smoothness;
               half3 Emission;
               half Metallic;
               half3 Specular;
               half Occlusion;
               half SpecularPower; 
               half Alpha;
               float outputDepth;

               // HDRP Only
               half SpecularOcclusion;
               half SubsurfaceMask;
               half Thickness;
               half CoatMask;
               half CoatSmoothness;
               half Anisotropy;
               half IridescenceMask;
               half IridescenceThickness;
               int DiffusionProfileHash;
               // requires _OVERRIDE_BAKEDGI to be defined, but is mapped in all pipelines
               float3 DiffuseGI;
               float3 BackDiffuseGI;
               float3 SpecularGI;
               // requires _OVERRIDE_SHADOWMASK to be defines
               float4 shadowMask;
            };

            struct Blackboard
            {
                %BLACKBOARD%
                float blackboardDummyData;
            };

            struct ShaderData
            {
               float4 clipPos; // SV_POSITION
               float3 localSpacePosition;
               float3 localSpaceNormal;
               float3 localSpaceTangent;
        
               float3 worldSpacePosition;
               float3 worldSpaceNormal;
               float3 worldSpaceTangent;
               float tangentSign;

               float3 worldSpaceViewDir;
               float3 tangentSpaceViewDir;

               float4 texcoord0;
               float4 texcoord1;
               float4 texcoord2;
               float4 texcoord3;

               float2 screenUV;
               float4 screenPos;

               float4 vertexColor;
               bool isFrontFace;

               float4 extraV2F0;
               float4 extraV2F1;
               float4 extraV2F2;
               float4 extraV2F3;
               float4 extraV2F4;
               float4 extraV2F5;
               float4 extraV2F6;
               float4 extraV2F7;

               float3x3 TBNMatrix;
               Blackboard blackboard;
            };

            struct VertexData
            {
               uint vertexID : SV_VertexID;
               float4 vertex : POSITION;
               float3 normal : NORMAL;
               float4 tangent : TANGENT;
               float4 texcoord0 : TEXCOORD0;
               float4 texcoord1 : TEXCOORD1;
               float4 texcoord2 : TEXCOORD2;
               float4 texcoord3 : TEXCOORD3;
               float4 vertexColor : COLOR;
                float3 previousPositionOS : TEXCOORD4;
                float3 precomputedVelocity    : TEXCOORD5; 
            };

            struct TessVertex 
            {
               float4 vertex : INTERNALTESSPOS;
               float3 normal : NORMAL;
               float4 tangent : TANGENT;
               float4 texcoord0 : TEXCOORD0%TEXCOORD0MOD%;
               float4 texcoord1 : TEXCOORD1%TEXCOORD1MOD%;
               float4 texcoord2 : TEXCOORD2%TEXCOORD2MOD%;
               float4 texcoord3 : TEXCOORD3%TEXCOORD3MOD%;
               float4 vertexColor : COLOR%VERTEXCOLORMOD%;
               float4 extraV2F0 : TEXCOORD4%EXTRAV2F0MOD%;
               float4 extraV2F1 : TEXCOORD5%EXTRAV2F1MOD%;
               float4 extraV2F2 : TEXCOORD6%EXTRAV2F2MOD%;
               float4 extraV2F3 : TEXCOORD7%EXTRAV2F3MOD%;
               float4 extraV2F4 : TEXCOORD8%EXTRAV2F4MOD%;
               float4 extraV2F5 : TEXCOORD9%EXTRAV2F5MOD%;
               float4 extraV2F6 : TEXCOORD10%EXTRAV2F6MOD%;
               float4 extraV2F7 : TEXCOORD11%EXTRAV2F7MOD%;
               float3 previousPositionOS : TEXCOORD12;
               float3 precomputedVelocity : TEXCOORD13;
            };

            struct ExtraV2F
            {
               float4 extraV2F0;
               float4 extraV2F1;
               float4 extraV2F2;
               float4 extraV2F3;
               float4 extraV2F4;
               float4 extraV2F5;
               float4 extraV2F6;
               float4 extraV2F7;
               Blackboard blackboard;
            };`, BetterShadersServices.MACROS = `
// Initialize arbitrary structure with zero values.
// Do not exist on some platform, in this case we need to have a standard name that call a function that will initialize all parameters to 0
#define ZERO_INITIALIZE(type, name) name = (type)0;
#define ZERO_INITIALIZE_ARRAY(type, name, arraySize) { for (int arrayIndex = 0; arrayIndex < arraySize; arrayIndex++) { name[arrayIndex] = (type)0; } }

// Texture util abstraction

#define CALCULATE_TEXTURE2D_LOD(textureName, samplerName, coord2) textureName.CalculateLevelOfDetail(samplerName, coord2)

// Texture abstraction

#define TEXTURE2D(textureName)                Texture2D textureName
#define TEXTURE2D_ARRAY(textureName)          Texture2DArray textureName
#define TEXTURECUBE(textureName)              TextureCube textureName
#define TEXTURECUBE_ARRAY(textureName)        TextureCubeArray textureName
#define TEXTURE3D(textureName)                Texture3D textureName

#define TEXTURE2D_FLOAT(textureName)          TEXTURE2D(textureName)
#define TEXTURE2D_ARRAY_FLOAT(textureName)    TEXTURE2D_ARRAY(textureName)
#define TEXTURECUBE_FLOAT(textureName)        TEXTURECUBE(textureName)
#define TEXTURECUBE_ARRAY_FLOAT(textureName)  TEXTURECUBE_ARRAY(textureName)
#define TEXTURE3D_FLOAT(textureName)          TEXTURE3D(textureName)

#define TEXTURE2D_HALF(textureName)           TEXTURE2D(textureName)
#define TEXTURE2D_ARRAY_HALF(textureName)     TEXTURE2D_ARRAY(textureName)
#define TEXTURECUBE_HALF(textureName)         TEXTURECUBE(textureName)
#define TEXTURECUBE_ARRAY_HALF(textureName)   TEXTURECUBE_ARRAY(textureName)
#define TEXTURE3D_HALF(textureName)           TEXTURE3D(textureName)

#define TEXTURE2D_SHADOW(textureName)         TEXTURE2D(textureName)
#define TEXTURE2D_ARRAY_SHADOW(textureName)   TEXTURE2D_ARRAY(textureName)
#define TEXTURECUBE_SHADOW(textureName)       TEXTURECUBE(textureName)
#define TEXTURECUBE_ARRAY_SHADOW(textureName) TEXTURECUBE_ARRAY(textureName)

#define RW_TEXTURE2D(type, textureName)       RWTexture2D<type> textureName
#define RW_TEXTURE2D_ARRAY(type, textureName) RWTexture2DArray<type> textureName
#define RW_TEXTURE3D(type, textureName)       RWTexture3D<type> textureName

#define SAMPLER(samplerName)                  SamplerState samplerName
#define SAMPLER_CMP(samplerName)              SamplerComparisonState samplerName

#define TEXTURE2D_PARAM(textureName, samplerName)                 TEXTURE2D(textureName),         SAMPLER(samplerName)
#define TEXTURE2D_ARRAY_PARAM(textureName, samplerName)           TEXTURE2D_ARRAY(textureName),   SAMPLER(samplerName)
#define TEXTURECUBE_PARAM(textureName, samplerName)               TEXTURECUBE(textureName),       SAMPLER(samplerName)
#define TEXTURECUBE_ARRAY_PARAM(textureName, samplerName)         TEXTURECUBE_ARRAY(textureName), SAMPLER(samplerName)
#define TEXTURE3D_PARAM(textureName, samplerName)                 TEXTURE3D(textureName),         SAMPLER(samplerName)

#define TEXTURE2D_SHADOW_PARAM(textureName, samplerName)          TEXTURE2D(textureName),         SAMPLER_CMP(samplerName)
#define TEXTURE2D_ARRAY_SHADOW_PARAM(textureName, samplerName)    TEXTURE2D_ARRAY(textureName),   SAMPLER_CMP(samplerName)
#define TEXTURECUBE_SHADOW_PARAM(textureName, samplerName)        TEXTURECUBE(textureName),       SAMPLER_CMP(samplerName)
#define TEXTURECUBE_ARRAY_SHADOW_PARAM(textureName, samplerName)  TEXTURECUBE_ARRAY(textureName), SAMPLER_CMP(samplerName)

#define TEXTURE2D_ARGS(textureName, samplerName)                textureName, samplerName
#define TEXTURE2D_ARRAY_ARGS(textureName, samplerName)          textureName, samplerName
#define TEXTURECUBE_ARGS(textureName, samplerName)              textureName, samplerName
#define TEXTURECUBE_ARRAY_ARGS(textureName, samplerName)        textureName, samplerName
#define TEXTURE3D_ARGS(textureName, samplerName)                textureName, samplerName

#define TEXTURE2D_SHADOW_ARGS(textureName, samplerName)         textureName, samplerName
#define TEXTURE2D_ARRAY_SHADOW_ARGS(textureName, samplerName)   textureName, samplerName
#define TEXTURECUBE_SHADOW_ARGS(textureName, samplerName)       textureName, samplerName
#define TEXTURECUBE_ARRAY_SHADOW_ARGS(textureName, samplerName) textureName, samplerName

#define SAMPLE_TEXTURE2D(textureName, samplerName, coord2)                               textureName.Sample(samplerName, coord2)
#define SAMPLE_TEXTURE2D_LOD(textureName, samplerName, coord2, lod)                      textureName.SampleLevel(samplerName, coord2, lod)
#define SAMPLE_TEXTURE2D_BIAS(textureName, samplerName, coord2, bias)                    textureName.SampleBias(samplerName, coord2, bias)
#define SAMPLE_TEXTURE2D_GRAD(textureName, samplerName, coord2, dpdx, dpdy)              textureName.SampleGrad(samplerName, coord2, dpdx, dpdy)
#define SAMPLE_TEXTURE2D_ARRAY(textureName, samplerName, coord2, index)                  textureName.Sample(samplerName, float3(coord2, index))
#define SAMPLE_TEXTURE2D_ARRAY_LOD(textureName, samplerName, coord2, index, lod)         textureName.SampleLevel(samplerName, float3(coord2, index), lod)
#define SAMPLE_TEXTURE2D_ARRAY_BIAS(textureName, samplerName, coord2, index, bias)       textureName.SampleBias(samplerName, float3(coord2, index), bias)
#define SAMPLE_TEXTURE2D_ARRAY_GRAD(textureName, samplerName, coord2, index, dpdx, dpdy) textureName.SampleGrad(samplerName, float3(coord2, index), dpdx, dpdy)
#define SAMPLE_TEXTURECUBE(textureName, samplerName, coord3)                             textureName.Sample(samplerName, coord3)
#define SAMPLE_TEXTURECUBE_LOD(textureName, samplerName, coord3, lod)                    textureName.SampleLevel(samplerName, coord3, lod)
#define SAMPLE_TEXTURECUBE_BIAS(textureName, samplerName, coord3, bias)                  textureName.SampleBias(samplerName, coord3, bias)
#define SAMPLE_TEXTURECUBE_ARRAY(textureName, samplerName, coord3, index)                textureName.Sample(samplerName, float4(coord3, index))
#define SAMPLE_TEXTURECUBE_ARRAY_LOD(textureName, samplerName, coord3, index, lod)       textureName.SampleLevel(samplerName, float4(coord3, index), lod)
#define SAMPLE_TEXTURECUBE_ARRAY_BIAS(textureName, samplerName, coord3, index, bias)     textureName.SampleBias(samplerName, float4(coord3, index), bias)
#define SAMPLE_TEXTURE3D(textureName, samplerName, coord3)                               textureName.Sample(samplerName, coord3)
#define SAMPLE_TEXTURE3D_LOD(textureName, samplerName, coord3, lod)                      textureName.SampleLevel(samplerName, coord3, lod)

#define SAMPLE_TEXTURE2D_SHADOW(textureName, samplerName, coord3)                    textureName.SampleCmpLevelZero(samplerName, (coord3).xy, (coord3).z)
#define SAMPLE_TEXTURE2D_ARRAY_SHADOW(textureName, samplerName, coord3, index)       textureName.SampleCmpLevelZero(samplerName, float3((coord3).xy, index), (coord3).z)
#define SAMPLE_TEXTURECUBE_SHADOW(textureName, samplerName, coord4)                  textureName.SampleCmpLevelZero(samplerName, (coord4).xyz, (coord4).w)
#define SAMPLE_TEXTURECUBE_ARRAY_SHADOW(textureName, samplerName, coord4, index)     textureName.SampleCmpLevelZero(samplerName, float4((coord4).xyz, index), (coord4).w)

#define LOAD_TEXTURE2D(textureName, unCoord2)                                   textureName.Load(int3(unCoord2, 0))
#define LOAD_TEXTURE2D_LOD(textureName, unCoord2, lod)                          textureName.Load(int3(unCoord2, lod))
#define LOAD_TEXTURE2D_MSAA(textureName, unCoord2, sampleIndex)                 textureName.Load(unCoord2, sampleIndex)
#define LOAD_TEXTURE2D_ARRAY(textureName, unCoord2, index)                      textureName.Load(int4(unCoord2, index, 0))
#define LOAD_TEXTURE2D_ARRAY_MSAA(textureName, unCoord2, index, sampleIndex)    textureName.Load(int3(unCoord2, index), sampleIndex)
#define LOAD_TEXTURE2D_ARRAY_LOD(textureName, unCoord2, index, lod)             textureName.Load(int4(unCoord2, index, lod))
#define LOAD_TEXTURE3D(textureName, unCoord3)                                   textureName.Load(int4(unCoord3, 0))
#define LOAD_TEXTURE3D_LOD(textureName, unCoord3, lod)                          textureName.Load(int4(unCoord3, lod))

#define PLATFORM_SUPPORT_GATHER
#define GATHER_TEXTURE2D(textureName, samplerName, coord2)                textureName.Gather(samplerName, coord2)
#define GATHER_TEXTURE2D_ARRAY(textureName, samplerName, coord2, index)   textureName.Gather(samplerName, float3(coord2, index))
#define GATHER_TEXTURECUBE(textureName, samplerName, coord3)              textureName.Gather(samplerName, coord3)
#define GATHER_TEXTURECUBE_ARRAY(textureName, samplerName, coord3, index) textureName.Gather(samplerName, float4(coord3, index))
#define GATHER_RED_TEXTURE2D(textureName, samplerName, coord2)            textureName.GatherRed(samplerName, coord2)
#define GATHER_GREEN_TEXTURE2D(textureName, samplerName, coord2)          textureName.GatherGreen(samplerName, coord2)
#define GATHER_BLUE_TEXTURE2D(textureName, samplerName, coord2)           textureName.GatherBlue(samplerName, coord2)
#define GATHER_ALPHA_TEXTURE2D(textureName, samplerName, coord2)          textureName.GatherAlpha(samplerName, coord2)

#define UNITY_MATRIX_M     unity_ObjectToWorld
#define UNITY_MATRIX_I_M   unity_WorldToObject
#define UNITY_MATRIX_V     unity_MatrixV
#define UNITY_MATRIX_I_V   unity_MatrixInvV
#define UNITY_MATRIX_P     OptimizeProjectionMatrix(glstate_matrix_projection)
#define UNITY_MATRIX_VP    unity_MatrixVP
#define UNITY_MATRIX_MV    mul(UNITY_MATRIX_V, UNITY_MATRIX_M)
#define UNITY_MATRIX_T_MV  transpose(UNITY_MATRIX_MV)
#define UNITY_MATRIX_IT_MV transpose(mul(UNITY_MATRIX_I_M, UNITY_MATRIX_I_V))
#define UNITY_MATRIX_MVP   mul(UNITY_MATRIX_VP, UNITY_MATRIX_M)

#if (defined(SHADER_API_D3D11) || defined(SHADER_API_XBOXONE) || defined(UNITY_COMPILER_HLSLCC) || defined(SHADER_API_PSSL) || (SHADER_TARGET_SURFACE_ANALYSIS && !SHADER_TARGET_SURFACE_ANALYSIS_MOJOSHADER))
    #define UNITY_SAMPLE_TEX2D_LOD(tex,coord, lod) tex.SampleLevel (sampler##tex,coord, lod)
    #define UNITY_SAMPLE_TEX2D_SAMPLER_LOD(tex,samplertex,coord, lod) tex.SampleLevel (sampler##samplertex,coord, lod)
#else
    #define UNITY_SAMPLE_TEX2D_LOD(tex,coord,lod) tex2D (tex,coord,0,lod)
    #define UNITY_SAMPLE_TEX2D_SAMPLER_LOD(tex,samplertex,coord,lod) tex2D (tex,coord,0,lod)
#endif`, BetterShadersServices.PropertyDrawers = ["BetterHeader", "GroupRollout", "GroupFoldout", "Group", "BetterHeaderToggleKeyword", "ShowIf", "ShowIfDrawer", "Range01", "Vec2", "Vec2Split", "Message"], BetterShadersServices.KeyWords = ["BEGIN_OPTIONS", "END_OPTIONS", "BEGIN_PROPERTIES", "END_PROPERTIES", "BEGIN_CBUFFER", "END_CBUFFER", "BEGIN_DEFINES", "END_DEFINES", "BEGIN_CODE", "END_CODE", "BEGIN_SUBSHADERS", "BEGIN_SUBSHADERS", "BEGIN_PASS", "END_PASS", "BEGIN_BLACKBOARD", "END_BLACKBOARD", "BEGIN_CUSTOM_PASS", "END_CUSTOM_PASS", "ShaderName", "Tessellation", "Alpha", "Fallback", "Dependency", "CustomEditor", "Tags", "Workflow", "StripV2F", "Stackable", "VertexColorModifier", "ExtraV2F3Require", "Pipeline", "DisableGBufferPass", "DisableShadowPass", "ShaderTarget", "EnableTransparentDepthPass"], BetterShadersServices.CommonFunctions = `
            float3 WorldToTangentSpace(ShaderData d, float3 normal)
            {
               return mul(d.TBNMatrix, normal);
            }

            float3 TangentToWorldSpace(ShaderData d, float3 normal)
            {
               return mul(normal, d.TBNMatrix);
            }

            // in this case, make standard more like SRPs, because we can't fix
            // unity_WorldToObject in HDRP, since it already does macro-fu there

            #if _STANDARD
               float3 TransformWorldToObject(float3 p) { return mul(unity_WorldToObject, float4(p, 1)); };
               float3 TransformObjectToWorld(float3 p) { return mul(unity_ObjectToWorld, float4(p, 1)); };
               float4 TransformWorldToObject(float4 p) { return mul(unity_WorldToObject, p); };
               float4 TransformObjectToWorld(float4 p) { return mul(unity_ObjectToWorld, p); };
               float4x4 GetWorldToObjectMatrix() { return unity_WorldToObject; }
               float4x4 GetObjectToWorldMatrix() { return unity_ObjectToWorld; }
            #endif

            float3 GetCameraWorldPosition()
            {
               #if _HDRP
                  return GetCameraRelativePositionWS(_WorldSpaceCameraPos);
               #else
                  return _WorldSpaceCameraPos;
               #endif
            }

            #if _GRABPASSUSED
               #if _STANDARD
                  TEXTURE2D(%GRABTEXTURE%);
                  SAMPLER(sampler_%GRABTEXTURE%);
               #endif

               half3 GetSceneColor(float2 uv)
               {
                  #if _STANDARD
                     return SAMPLE_TEXTURE2D(%GRABTEXTURE%, sampler_%GRABTEXTURE%, uv).rgb;
                  #else
                     return SHADERGRAPH_SAMPLE_SCENE_COLOR(uv);
                  #endif
               }
            #endif


      
            #if _STANDARD
               UNITY_DECLARE_DEPTH_TEXTURE(_CameraDepthTexture);
               float GetSceneDepth(float2 uv) { return SAMPLE_DEPTH_TEXTURE(_CameraDepthTexture, uv); }
               float GetLinear01Depth(float2 uv) { return Linear01Depth(GetSceneDepth(uv)); }
               float GetLinearEyeDepth(float2 uv) { return LinearEyeDepth(GetSceneDepth(uv)); } 


            float3 GetWorldPositionFromDepthBuffer(float2 uv, float3 worldSpaceViewDir)
            {
               float eye = GetLinearEyeDepth(uv);
               float3 camView = mul((float3x3)UNITY_MATRIX_M, transpose(mul(UNITY_MATRIX_I_M, UNITY_MATRIX_I_V)) [2].xyz);

               float dt = dot(worldSpaceViewDir, camView);
               float3 div = worldSpaceViewDir/dt;
               float3 wpos = (eye * div) + GetCameraWorldPosition();
               return wpos;
            }

               float3 GetSceneNormal(float2 uv, float3 worldSpaceViewDir)
               {
                  float4 depthNorms = UNITY_SAMPLE_SCREENSPACE_TEXTURE(_CameraDepthNormalsTexture, uv);
                  float3 norms = DecodeViewNormalStereo(depthNorms);
                  norms = mul((float3x3)UNITY_MATRIX_V, norms) * 0.5 + 0.5;
                  return norms;
               }


               half3 UnpackNormalmapRGorAG(half4 packednormal)
               {
                     // This do the trick
                  packednormal.x *= packednormal.w;

                  half3 normal;
                  normal.xy = packednormal.xy * 2 - 1;
                  normal.z = sqrt(1 - saturate(dot(normal.xy, normal.xy)));
                  return normal;
               }
               half3 UnpackNormal(half4 packednormal)
               {
               }

               half3 UnpackScaleNormal(half4 packednormal, half scale)
               {
# ifndef UNITY_NO_DXT5nm
                   // Unpack normal as DXT5nm (1, y, 1, x) or BC5 (x, y, 0, 1)
                   // Note neutral texture like ""bump"" is (0, 0, 1, 1) to work with both plain RGB normal and DXT5nm/BC5
                   packednormal.x *= packednormal.w;
#endif
        half3 normal;
        normal.xy = (packednormal.xy* 2 - 1) * scale;
                   normal.z = sqrt(1 - saturate(dot(normal.xy, normal.xy)));
                   return normal;
               }

#endif


    void GetSun(out float3 lightDir, out float3 color)
    {
        lightDir = float3(0.5, 0.5, 0);
        color = 1;
#if _HDRP
                  if (_DirectionalLightCount > 0)
                  {
                     DirectionalLightData light = _DirectionalLightDatas[0];
                     lightDir = -light.forward.xyz;
                     color = light.color;
                  }
#elif _STANDARD
			         lightDir = normalize(_WorldSpaceLightPos0.xyz);
                  color = _LightColor0.rgb;
#elif _URP
	               Light light = GetMainLight();
	               lightDir = light.direction;
	               color = light.color;
#endif
    }`,
    function (e) {
        e[e.Code = 0] = "Code", e[e.String = 1] = "String", e[e.Comment = 2] = "Comment"
    }(CodeSegmentType = exports.CodeSegmentType || (exports.CodeSegmentType = {}));
class CodeSegments {
    constructor(e, t) {
        this.code = e, this.type = t
    }
}
exports.CodeSegments = CodeSegments;
class ShadeViewCaching {
    static getPath(e, t) {
        this.extensionInstallPath || (this.extensionInstallPath = vscode_1.extensions.getExtension("avvsky.shadeview").extensionPath);
        var r = ("" + e.fsPath + t).toLocaleLowerCase();
        if (this.PathMap.has(r)) return this.PathMap.get(r);
        t = Utilities_1.default.getPath(e, t, this.extensionInstallPath);
        return t && this.PathMap.set(r, t.fsPath), null
    }
    static getTextDocument(r) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.Documents.has(r)) return this.Documents.get(r);
            let e;
            for (const t of vscode_1.workspace.textDocuments)
                if (t.uri.fsPath == r) {
                    e = t;
                    break
                } return e = e || (yield vscode_1.workspace.openTextDocument(r)), this.Documents.set(r, e), e
        })
    }
    static getIncludeFile(e) {
        if (this.IncludeFilesMap.has(e)) return this.IncludeFilesMap.get(e);
        var t = new IncludeFile(e);
        return this.IncludeFilesMap.set(e, t), t
    }
    static getBetterShadersCommonFunctions(e) {
        return 0 == this.BetterCommonFunctions.length && (this.BetterCommonFunctions = BetterShadersServices.getCommonFunctions(e)), this.BetterCommonFunctions
    }
    static getBetterShadersMacros(e) {
        return 0 == this.BetterShadersMacros.length && (this.BetterShadersMacros = e.getMacrosDefinations(BetterShadersServices.getMacrosCode())), this.BetterShadersMacros
    }
    static getCodeSymbols(e, t, r) {
        var a = t + e.uri.fsPath;
        if (!e.isDirty && this.CodeSymbolMap.has(a)) return this.CodeSymbolMap.get(a);
        t = r(e, t);
        return this.CodeSymbolMap.set(a, t), t
    }
    static getAllMethodsInfo(e, t) {
        var r = e.uri.fsPath;
        if (!e.isDirty && this.StructsMap.has(r)) return this.MethodsMap.get(r);
        e = t(e);
        return this.MethodsMap.set(r, e), e
    }
    static getAllStrutcs(e, t) {
        var r = e.uri.fsPath;
        if (!e.isDirty && this.StructsMap.has(r)) return this.StructsMap.get(r);
        e = t(e);
        return this.StructsMap.set(r, e), e
    }
    static isFileModifed(e) {
        return !this.FileStatusMap.has(e) || this.FileStatusMap.get(e) != Utilities_1.default.getFileMTimeInMS(e)
    }
    static getFileContent(e) {
        if (!this.isFileModifed(e)) return this.FileContentMap.get(e);
        var t = Utilities_1.default.readFile(e);
        return this.FileContentMap.set(e, t), this.FileStatusMap.set(e, Utilities_1.default.getFileMTimeInMS(e)), t
    }
    static getCompletions(e, t, r) {
        e = e.toString() + t;
        if (("Data" == t || !this.isFileModifed(t)) && this.CCMap.has(e)) return this.CCMap.get(e);
        r = r();
        return this.CCMap.set(e, r), r
    }
    static getCompletionsAsync(r, a, i) {
        return __awaiter(this, void 0, void 0, function* () {
            var e = r.toString() + a;
            if (("Data" == a || !this.isFileModifed(a)) && this.CCMap.has(e)) return this.CCMap.get(e);
            var t = yield i();
            return this.CCMap.set(e, t), t
        })
    }
    static getSignatureHelpInfo(e, t) {
        if (!this.isFileModifed(e) && this.SignatureMap.has(e)) return this.SignatureMap.get(e);
        t = t();
        return this.SignatureMap.set(e, t), t
    }
    static getMethodSignatureInfo(e, t) {
        if (!this.isFileModifed(e) && this.MethodSignatureInfoMap.has(e)) return this.MethodSignatureInfoMap.get(e);
        t = t();
        return this.MethodSignatureInfoMap.set(e, t), t
    }
    static getSignatureInfo(e, t) {
        if (this.CodeToSignatureInfoMap.has(e)) return this.CodeToSignatureInfoMap.get(e);
        t = t();
        return this.CodeToSignatureInfoMap.set(e, t), t
    }
}
ShadeViewCaching.FileStatusMap = new Map, ShadeViewCaching.FileContentMap = new Map, ShadeViewCaching.IncludeFilesMap = new Map, ShadeViewCaching.StructsMap = new Map, ShadeViewCaching.MethodsMap = new Map, ShadeViewCaching.CodeSymbolMap = new Map, ShadeViewCaching.CCMap = new Map, ShadeViewCaching.SignatureMap = new Map, ShadeViewCaching.MethodSignatureInfoMap = new Map, ShadeViewCaching.CodeToSignatureInfoMap = new Map, ShadeViewCaching.BetterShadersMacros = [], ShadeViewCaching.BetterCommonFunctions = [], ShadeViewCaching.Documents = new Map, ShadeViewCaching.PathMap = new Map, ShadeViewCaching.extensionInstallPath = "",
    function (e) {
        e[e.Method = 0] = "Method", e[e.Types = 1] = "Types", e[e.Macro = 2] = "Macro", e[e.DataConfig = 3] = "DataConfig", e[e.DocumentVariables = 4] = "DocumentVariables"
    }(CacheType = CacheType || {});
class Signature {
    constructor() {
        this.name = "", this.signature = ""
    }
}
class TypeInfomation {
    constructor() {
        this.label = "", this.fields = [], this.methods = []
    }
}
class VariableHierarchyItem {
    constructor(e, t) {
        this.Name = e, this.isMethod = t
    }
}
class IncludeFile {
    constructor(e) {
        this.path = e
    }
    getContent() {
        return ShadeViewCaching.getFileContent(this.path)
    }
}
class TypeFiledInformation {
    constructor() {
        this.type = "", this.name = "", this.documentation = ""
    }
}
class CodeSymbol {
    constructor(e, t, r) {
        this.name = e, this.type = t, this.location = r, this.children = [], this.start = -1
    }
}