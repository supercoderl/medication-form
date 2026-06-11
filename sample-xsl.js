// XSL mẫu - transform CDA <text> sang HTML (để minh hoạ tính năng render bằng XSL).
// Bạn thay bằng nội dung file XSL thật của mình (vd CDA_PhieuTheoDoiDieuTri_Review.xsl).
window.SAMPLE_XSL = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:hl7="urn:hl7-org:v3"
  exclude-result-prefixes="hl7">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <div class="xsl-doc">
      <xsl:apply-templates select="//hl7:section/hl7:text"/>
    </div>
  </xsl:template>

  <xsl:template match="hl7:text">
    <xsl:apply-templates/>
  </xsl:template>

  <xsl:template match="hl7:paragraph">
    <p class="cda-p {@styleCode}"><xsl:apply-templates/></p>
  </xsl:template>

  <xsl:template match="hl7:content">
    <span class="{@styleCode}"><xsl:apply-templates/></span>
  </xsl:template>

  <xsl:template match="hl7:list">
    <ul><xsl:apply-templates/></ul>
  </xsl:template>

  <xsl:template match="hl7:item">
    <li><xsl:apply-templates/></li>
  </xsl:template>

  <xsl:template match="hl7:table">
    <table><xsl:apply-templates/></table>
  </xsl:template>
  <xsl:template match="hl7:thead"><thead><xsl:apply-templates/></thead></xsl:template>
  <xsl:template match="hl7:tbody"><tbody><xsl:apply-templates/></tbody></xsl:template>
  <xsl:template match="hl7:tr"><tr><xsl:apply-templates/></tr></xsl:template>
  <xsl:template match="hl7:th"><th class="{@styleCode}"><xsl:apply-templates/></th></xsl:template>
  <xsl:template match="hl7:td"><td class="{@styleCode}"><xsl:apply-templates/></td></xsl:template>
  <xsl:template match="hl7:caption"><caption><xsl:apply-templates/></caption></xsl:template>
  <xsl:template match="hl7:br"><br/></xsl:template>

</xsl:stylesheet>`;
