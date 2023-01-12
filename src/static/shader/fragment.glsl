varying vec2 vCoordinates;
varying vec3 vPos;

uniform sampler2D t1;
uniform sampler2D t2;
uniform sampler2D mask;

uniform float displacement;
uniform float tt1alpha;
uniform float tt2alpha;

void main()	{
	vec4 maskTexture = texture2D(mask, gl_PointCoord);
	vec2 myUV = vec2(vCoordinates.x/512.,vCoordinates.y/512.);

	vec4 tt1 = texture2D(t1, myUV);
	vec4 tt2 = texture2D(t2, myUV);

	tt1.a = tt1alpha;
	tt2.a = tt2alpha;

	vec4 final = mix(tt1, tt2, displacement);
	float alpha = clamp( abs(vPos.x) / 3000. + abs(vPos.y) / 3000. + 100. / abs(vPos.z), .0, 1.);

	gl_FragColor = final;
	gl_FragColor.a *= maskTexture.r * alpha;
}
