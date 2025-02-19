"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const Builtins={StructInfo:`
struct SurfaceOutput {
	fixed3 Albedo;
	fixed3 Normal;
	fixed3 Emission;
	half Specular;
	fixed Gloss;
	fixed Alpha;
};

struct SurfaceOutputStandard
{
    fixed3 Albedo; 
    fixed3 Normal; 
    half3 Emission;
    half Metallic; 
    half Smoothness;
    half Occlusion;
    fixed Alpha;
};

struct SurfaceOutputStandardSpecular
{
    fixed3 Albedo;
    fixed3 Specular;
    fixed3 Normal;
    half3 Emission;
    half Smoothness;
    half Occlusion;
    fixed Alpha;
};

struct fixed4 {
    fixed r;
    fixed g;
    fixed b;
    fixed a;
    fixed2 rg;
    fixed2 rb;
    fixed2 gb;
    fixed3 rgb;
    fixed4 rgba;
    fixed x;
    fixed y;
    fixed z;
    fixed w;
    fixed2 xy;
    fixed2 xz;
    fixed2 yz;
    fixed2 zw;
    fixed3 xyz;
    fixed4 xyzw;
};

struct fixed3 {
    fixed r;
    fixed g;
    fixed b;
    fixed2 rg;
    fixed2 rb;
    fixed2 gb;
    fixed3 rgb;
    fixed x;
    fixed y;
    fixed z;
    fixed2 xy;
    fixed2 xz;
    fixed2 yz;
    fixed3 xyz;
};

struct fixed2 {
    fixed r;
    fixed g;
    fixed2 rg;
    fixed x;
    fixed y;
    fixed2 xy;
};

struct half4 {
    half r;
    half g;
    half b;
    half a;
    half2 rg;
    half2 rb;
    half2 gb;
    half3 rgb;
    half4 rgba;
    half x;
    half y;
    half z;
    half w;
    half2 xy;
    half2 xz;
    half2 yz;
    half2 zw;
    half3 xyz;
    half4 xyzw;
};

struct half3 {
    half r;
    half g;
    half b;
    half2 rg;
    half2 rb;
    half2 gb;
    half3 rgb;
    half x;
    half y;
    half z;
    half2 xy;
    half2 xz;
    half2 yz;
    half3 xyz;
};

struct half2 {
    fixed r;
    fixed g;
    fixed rg;
    half x;
    half y;
    half2 xy;
};

struct uint4 {
    int r;
    int g;
    int b;
    int a;
    int2 rg;
    int2 rb;
    int2 gb;
    int3 rgb;
    int4 rgba;
    int x;
    int y;
    int z;
    int w;
    int2 xy;
    int2 xz;
    int2 yz;
    int2 zw;
    int3 xyz;
    int4 xyzw;
};

struct uint3 {
    int r;
    int g;
    int b;
    int2 rg;
    int2 rb;
    int2 gb;
    int3 rgb;
    int x;
    int y;
    int z;
    int2 xy;
    int2 xz;
    int2 yz;
    int3 xyz;
};

struct uint2 {
    int r;
    int g;
    int2 rg;
    int x;
    int y;
    int2 xy;
};


struct int4 {
    int r;
    int g;
    int b;
    int a;
    int2 rg;
    int2 rb;
    int2 gb;
    int3 rgb;
    int4 rgba;
    int x;
    int y;
    int z;
    int w;
    int2 xy;
    int2 xz;
    int2 yz;
    int2 zw;
    int3 xyz;
    int4 xyzw;
};

struct int3 {
    int r;
    int g;
    int b;
    int2 rg;
    int2 rb;
    int2 gb;
    int3 rgb;
    int x;
    int y;
    int z;
    int2 xy;
    int2 xz;
    int2 yz;
    int3 xyz;
};

struct int2 {
    int r;
    int g;
    int2 rg;
    int x;
    int y;
    int2 xy;
}

struct float4 {
    float r;
    float g;
    float b;
    float a;
    float2 rg;
    float2 rb;
    float2 gb;
    float3 rgb;
    float4 rgba;
    float x;
    float y;
    float z;
    float w;
    float2 xy;
    float2 xz;
    float2 yz;
    float2 zw;
    float3 xyz;
    float4 xyzw;
};

struct float3 {
    float r;
    float g;
    float b;
    float2 rg;
    float2 rb;
    float2 gb;
    float3 rgb;
    float x;
    float y;
    float z;
    float2 xy;
    float2 xz;
    float2 yz;
    float3 xyz;
};

struct float2 {
    float r;
    float g;
    float2 rg;
    float x;
    float y;
    float2 xy;
};

struct UBYTE4 {
    int x, 
    int y,
    int z,
    int w
};

struct double2 {
    double x;
    double y;
    double2 xy;
};

struct double3 {
    double x;
    double y;
    double z;
    double2 xy;
    double2 xz;
    double2 yz;
    double3 xyz;
};

struct double4 {
    double x;
    double y;
    double z;
    double w;
    double2 xy;
    double2 xz;
    double2 yz;
    double2 zw;
    double3 xyz;
    double4 xyzw;
};
    `};exports.default=Builtins;